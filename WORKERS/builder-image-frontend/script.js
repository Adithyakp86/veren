const { exec } = require("child_process");
const path = require("path");
const readDirRecursive = require("./utils/readDirRecursive");
const fs = require("fs");
const mime = require('mime-types');
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { Kafka } = require("kafkajs")

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY
const DEPLOYMENTID = process.env.DEPLOYMENTID;
const PROJECT_ID = process.env.PROJECT_ID;

// S3 CLIENT
const s3Client = new S3Client({
    region: 'ap-south-1', credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY
    }
});

// KAFKA
const kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID,
    brokers: [process.env.KAFKA_BROKER1],
    ssl: {
        ca: [
            fs.readFileSync(
                path.join(__dirname, '../../', 'kafka.pem'),
                'utf-8'
            )
        ]
    },
    sasl: {
        username: process.env.KAFKA_SASL_USERNAME,
        password: process.env.KAFKA_SASL_PASSWORD,
        mechanism: 'plain'
    }
})

const producer = kafka.producer()

// LOG PUBLISHER
async function publishLog(level, stage, message) {
    const logLine = `[${new Date().toISOString()}] [${level}] [${stage}] ${message}`;

    await producer.send({
        topic: "frontend-builder-logs",
        messages: [
            {
                key: "log",
                value: JSON.stringify({
                    PROJECT_ID,
                    DEPLOYMENTID,
                    log: logLine
                })
            }
        ]
    });
}

// SHUTDOWN
const shutdown = async (signal) => {
    console.log("Shutting down: ", signal);
    process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// MAIN EXECUTION
async function init() {
    await producer.connect();
    await publishLog("INFO", "INIT", "Executing frontend build script");
    const outDirPath = path.join(__dirname, "output")
    const frontendPath = path.join(outDirPath, process.env.FRONTENDPATH || "./");
    const buildCommand = process.env.BUILDCOMMAND || "npm run build";
    const installCommand = process.env.INSTALLCOMMAND || "npm install";
    const _process = exec(`cd ${frontendPath} && ${installCommand} && ${buildCommand}`)

    _process.stdout.on('data', async function (data) {
        await publishLog("INFO", "BUILD", data.toString().trim());
    });

    _process.stderr.on("data", async function (data) {
        await publishLog("ERROR", "BUILD", data.toString().trim());
    });

    _process.on('close', async function () {
        try {
            await publishLog("SUCCESS", "BUILD", "Almost there...");

            const distFolderPath = path.join(frontendPath, "dist")

            if (!fs.existsSync(distFolderPath)) {
                throw new Error("BUILD_FAILED: dist folder does not exist");
            }

            const distFolderContents = readDirRecursive(distFolderPath)

            for (const file of distFolderContents) {
                const filePath = path.join(distFolderPath, file)
                if (fs.lstatSync(filePath).isDirectory()) continue;

                console.log('uploading', filePath)

                const command = new PutObjectCommand({
                    Bucket: 'veren-v2',
                    Key: `__outputs/${PROJECT_ID}/${file}`,
                    Body: fs.createReadStream(filePath),
                    ContentType: mime.lookup(filePath)
                });

                await s3Client.send(command);

                await publishLog("SUCCESS", "BUILD", "Frontend build completed");
            }
        } catch (error) {
            await publishLog("ERROR", "BUILD", "Build Failed due to unknown reasons.");
        } finally {

        }
    })
}

init();

// TIMEOUT BRUTE FORCE LOL
const MAX_RUNTIME_MS = 10 * 60 * 1000;

setTimeout(async () => {
    await publishLog(
        "ERROR",
        "TIMEOUT",
        "Max task runtime exceeded. Forcing exit."
    );
    process.exit(124);
}, MAX_RUNTIME_MS);
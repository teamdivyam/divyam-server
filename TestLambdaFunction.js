import { config } from "./src/config/_config.js";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { NodeHttpHandler } from "@smithy/node-http-handler";

const uploadWithRetry = async (command, max = 3) => {
    for (let i = 0; i < max; i++) {
        try {
            return await client.send(command);
        } catch (err) {
            console.warn(`Upload attempt ${i + 1} failed`);
            if (i === max - 1) throw err;
        }
    }
};

const client = new LambdaClient({
    maxAttempts: 5,
    region: config.AWS_REGION,
    credentials: {
        accessKeyId: config.AWS_BUCKET_KEY,
        secretAccessKey: config.AWS_BUCKET_SECRET,

    },
    requestHandler: new NodeHttpHandler({
        connectionTimeout: 5000, //ms — wait for TCP connect
        socketTimeout: 10000     // ms — wait for TLS handshake + response
    }),
});


const params = {
    FunctionName: 'OrderInvoice_deploy',
    InvocationType: "Event",
    // LogType: "None",
    // ClientContext: "STRING_VALUE",
    // Qualifier: "STRING_VALUE",
    Payload: Buffer.from(JSON.stringify({
        success: true
    })),
};

const init = async () => {
    const command = new InvokeCommand(params);
    const res = await client.send(command);
    console.log(`Response ${JSON.stringify(res)}`);
}


init().then(() => {
    console.log("Successfully Executed..");
})
    .catch((error) => {
        console.log(`Failed error ${error}`);
    })

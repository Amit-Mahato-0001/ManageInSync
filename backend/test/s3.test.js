const s3 = require("../src/config/s3")
const { ListBucketsCommand } = require("@aws-sdk/client-s3")

async function test() {

    try {

        const result = await s3.send(

            new ListBucketsCommand({})
        )

        console.log(result.Buckets)

    } catch (err) {

        console.error(err)

    }
}

test()
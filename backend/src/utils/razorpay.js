const crypto = require("crypto")
const https = require("https")

const RAZORPAY_API_HOST = "api.razorpay.com"
const RAZORPAY_API_BASE_PATH = "/v1"

const createHttpError = (message, status = 500, code = "internal_error") => {
    const error = new Error(message)
    error.status = status
    error.code = code
    return error
}

const getRazorpayCredentials = () => {
    const keyId = process.env.RAZORPAY_KEY_ID?.trim()
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim()

    if (!keyId || !keySecret) {
        throw createHttpError(
            "Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
            500,
            "razorpay_not_configured"
        )
    }

    return { keyId, keySecret }
}

const makeRazorpayRequest = ({ method = "GET", path, body }) => {
    const { keyId, keySecret } = getRazorpayCredentials()
    const serializedBody = body ? JSON.stringify(body) : null

    return new Promise((resolve, reject) => {
        const request = https.request(
            {
                host: RAZORPAY_API_HOST,
                path: `${RAZORPAY_API_BASE_PATH}${path}`,
                method,
                headers: {
                    Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
                    "Content-Type": "application/json",
                    ...(serializedBody
                        ? {
                              "Content-Length": Buffer.byteLength(serializedBody)
                          }
                        : {})
                }
            },
            (response) => {
                let rawData = ""

                response.on("data", (chunk) => {
                    rawData += chunk
                })

                response.on("end", () => {
                    let parsedData = null

                    try {
                        parsedData = rawData ? JSON.parse(rawData) : null
                    } catch (error) {
                        parsedData = null
                    }

                    if (response.statusCode >= 200 && response.statusCode < 300) {
                        resolve(parsedData)
                        return
                    }

                    const errorMessage =
                        parsedData?.error?.description ||
                        parsedData?.error?.reason ||
                        parsedData?.error?.code ||
                        "Razorpay request failed"

                    reject(
                        createHttpError(
                            errorMessage,
                            response.statusCode >= 500 ? 502 : 400,
                            "razorpay_request_failed"
                        )
                    )
                })
            }
        )

        request.on("error", () => {
            reject(
                createHttpError(
                    "Unable to connect to Razorpay",
                    502,
                    "razorpay_unavailable"
                )
            )
        })

        if (serializedBody) {
            request.write(serializedBody)
        }

        request.end()
    })
}

const createOrder = (payload) =>
    makeRazorpayRequest({
        method: "POST",
        path: "/orders",
        body: payload
    })

const fetchPayment = (paymentId) =>
    makeRazorpayRequest({
        method: "GET",
        path: `/payments/${paymentId}`
    })

const capturePayment = ({ paymentId, amount, currency }) =>
    makeRazorpayRequest({
        method: "POST",
        path: `/payments/${paymentId}/capture`,
        body: {
            amount,
            currency
        }
    })

const verifyPaymentSignature = ({
    orderId,
    paymentId,
    razorpaySignature
}) => {
    const { keySecret } = getRazorpayCredentials()

    const generatedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(`${orderId}|${paymentId}`)
        .digest("hex")

    return generatedSignature === razorpaySignature
}

const getRazorpayPublicConfig = () => {
    const { keyId } = getRazorpayCredentials()

    return { keyId }
}

module.exports = {
    capturePayment,
    createOrder,
    fetchPayment,
    getRazorpayPublicConfig,
    verifyPaymentSignature
}

const { z } = require("zod")
const { objectId, dateString } = require("./common.validator")

const invoiceItemSchema = z.object({
    itemName: z
        .string()
        .trim()
        .min(1, "Item name is required")
        .max(120, "Item name is too long"),
    quantity: z.coerce
        .number()
        .positive("Quantity must be greater than 0"),
    unitPrice: z.coerce
        .number()
        .min(0, "Unit price must be at least 0"),
    taxRate: z.coerce
        .number()
        .min(0, "Tax must be at least 0")
        .max(100, "Tax cannot exceed 100")
})

const createInvoiceSchema = z
    .object({
        clientUserId: objectId("clientUserId"),
        contactName: z
            .string()
            .trim()
            .min(2, "Contact name must be at least 2 characters")
            .max(80, "Contact name is too long"),
        contactEmail: z
            .string()
            .trim()
            .email("Invalid contact email"),
        contactPhone: z
            .string()
            .trim()
            .max(30, "Phone is too long")
            .optional(),
        companyName: z
            .string()
            .trim()
            .max(120, "Company name is too long")
            .optional(),
        address: z
            .string()
            .trim()
            .max(300, "Address is too long")
            .optional(),
        issueDate: dateString("issueDate"),
        dueDate: dateString("dueDate"),
        reference: z
            .string()
            .trim()
            .max(80, "Reference is too long")
            .optional(),
        notes: z
            .string()
            .trim()
            .max(1000, "Notes are too long")
            .optional(),
        status: z.enum(["draft", "unpaid"]).optional(),
        items: z
            .array(invoiceItemSchema)
            .min(1, "At least one line item is required")
    })
    .refine(
        (data) => data.dueDate >= data.issueDate,
        {
            path: ["dueDate"],
            message: "Due date must be on or after issue date"
        }
    )

const invoiceListQuerySchema = z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
    search: z
        .string()
        .trim()
        .max(100, "Search is too long")
        .optional(),
    status: z
        .enum(["draft", "unpaid", "paid", "overdue"])
        .optional()
})

const invoiceParamsSchema = z.object({
    invoiceId: objectId("invoiceId")
})

const createInvoicePaymentSchema = z.object({
    gateway: z
        .string()
        .trim()
        .max(40, "Gateway is too long")
        .optional(),
    amount: z.coerce
        .number()
        .positive("Payment amount must be greater than 0")
        .optional()
})

module.exports = {
    createInvoiceSchema,
    invoiceListQuerySchema,
    invoiceParamsSchema,
    createInvoicePaymentSchema
}

import {
    dummyPaymentHandler,
    DefaultSearchPlugin,
    VendureConfig,
} from '@vendure/core';
import { defaultEmailHandlers, EmailPlugin } from '@vendure/email-plugin';
import { AssetServerPlugin, configureS3AssetStorage } from '@vendure/asset-server-plugin';
import { AdminUiPlugin } from '@vendure/admin-ui-plugin';
import { BullMQJobQueuePlugin } from '@vendure/job-queue-plugin/package/bullmq';
import path from 'path';
import { SwissQrInvoicePlugin } from './plugins/swiss-qr-invoice/swiss-qr-invoice-plugin';


export const config: VendureConfig = {
    apiOptions: {
        port: parseInt(<string>process.env.PORT) || 3000,
        adminApiPath: 'admin-api',
        adminApiPlayground: {
            settings: {
                'request.credentials': 'include',
            } as any,
        },// turn this off for production
        adminApiDebug: true, // turn this off for production
        shopApiPath: 'shop-api',
        shopApiPlayground: {
            settings: {
                'request.credentials': 'include',
            } as any,
        },// turn this off for production
        shopApiDebug: true,// turn this off for production
    },
    authOptions: {
        superadminCredentials: {
            identifier: <string>process.env.SUPERADMIN_IDENTIFIER,
            password: <string>process.env.SUPERADMIN_PASSWORD,
        },
        cookieOptions: {
          secret: process.env.COOKIE_SECRET || 'cookie-secret',
        },
        tokenMethod: 'bearer', // authorization header method
        requireVerification: false, // disable register by email verification
    },
    dbConnectionOptions: {
        type: 'postgres',
        synchronize: true, // turn this off for production
        logging: false,
        database: <string>process.env.DB_DATABASE,
        host: <string>process.env.DB_HOST,
        port: 5432,
        username: <string>process.env.DB_USERNAME,
        password: <string>process.env.DB_PASSWORD,
        migrations: [path.join(__dirname, '../migrations/*.ts')],
        extra: { max: 2 } // limit connections because of ElephantSQL
    },
    paymentOptions: {
        paymentMethodHandlers: [dummyPaymentHandler],
    },
    customFields: {},
    plugins: [
        AssetServerPlugin.init({
            route: 'assets',
            assetUploadDir: path.join(__dirname, '../static/assets'),
            storageStrategyFactory: configureS3AssetStorage({
                bucket: <string>process.env.AWS_BUCKET,
                credentials: {
                  accessKeyId: <string>process.env.AWS_ACCESS_KEY_ID,
                  secretAccessKey: <string>process.env.AWS_SECRET_ACCESS_KEY,
                },
              }),
        }),
        BullMQJobQueuePlugin.init({
            connection: {
                host: "redis-11771.c250.eu-central-1-1.ec2.cloud.redislabs.com",
                port: 11771,
                password: <string>process.env.REDIS_PASSWORD
            }
        }),
        DefaultSearchPlugin.init({ bufferUpdates: false, indexStockStatus: true }),
        EmailPlugin.init({
            devMode: true,
            outputPath: path.join(__dirname, '../static/email/test-emails'),
            route: 'mailbox',
            handlers: defaultEmailHandlers,
            templatePath: path.join(__dirname, '../static/email/templates'),
            globalTemplateVars: {
                // The following variables will change depending on your storefront implementation
                fromAddress: '"example" <noreply@example.com>',
                verifyEmailAddressUrl: 'http://localhost:8080/verify',
                passwordResetUrl: 'http://localhost:8080/password-reset',
                changeEmailAddressUrl: 'http://localhost:8080/verify-email-address-change'
            },
            transport: {
                type: 'smtp',
                host: 'smtp.sendgrid.net',
                port: 465,
                secure: true, // true for 465, false for other ports
                auth: {
                    user: <string>process.env.SMTP_USER,
                    pass: <string>process.env.SMTP_PASSWORD
                }
            }
        }),
        AdminUiPlugin.init({
            route: 'admin',
            port: 3002,
        }),
        SwissQrInvoicePlugin
    ],
};

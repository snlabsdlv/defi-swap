
import { config as configDotenv } from 'dotenv';
import { resolve } from 'path';


switch (process.env.NODE_ENV) {
    case "development":
        console.log("Environment is 'development'")
        configDotenv({
            path: resolve(__dirname, "../.env.development")
        })
        break
    case "production":
        configDotenv({
            path: resolve(__dirname, "../.env.production")
        })
        break
    default:
        throw new Error(`'NODE_ENV' ${process.env.NODE_ENV} is not handled!`)
}

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            NODE_ENV: 'development' | 'production';
            HOST: string;
            PORT?: string;
            PWD: string;
            INFURA_ENDPOINT_URL: string;
            INFURA_API_KEY: string;
            INFURA_TOKEN_ID: string;
        }
    }
}

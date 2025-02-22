import winston from 'winston'

const logger = winston.createLogger({
    level: 'info',
    defaultMeta: {
        "=>": "Server"
    },

    transports: [
        new winston.transports.Console({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json(),
            ),
        }),

        // new winston.transports.Console({
        //     level: 'debug',
        //     format: winston.format.combine(
        //         winston.format.timestamp(),
        //         winston.format.json(),
        //     ),
        // }),

        // new winston.transports.Console({
        //     level: 'debug',
        //     format: winston.format.combine(
        //         winston.format.timestamp(),
        //         winston.format.label({ label: 'DEBUG' }),
        //         winston.format.printf(({ timestamp, label, level, message }) => {
        //             return `${timestamp} [${label}] ${level.toUpperCase()}: ${message}`;
        //         })
        //     ),
        // }),
    ],
});

export default logger

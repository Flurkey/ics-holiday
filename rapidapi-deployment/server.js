/**
 * Holiday Calendar API - Production Ready for RapidAPI
 * 
 * Professional API for generating iCalendar (ICS) files with public holidays worldwide
 * Ready for deployment and monetization on RapidAPI
 * 
 * Features:
 * - RFC 5545 compliant ICS generation
 * - 100+ countries supported
 * - Professional rate limiting
 * - Comprehensive error handling
 * - Production logging
 * - Security headers
 * - CORS support
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const winston = require('winston');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;

// Enhanced logger configuration for production
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: {
        service: 'holiday-calendar-api',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'production'
    },
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

// Production middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['*'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-RapidAPI-Proxy-Secret', 'X-RapidAPI-User', 'X-RapidAPI-Subscription']
}));

app.use(compression());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));

// Enhanced rate limiting for RapidAPI
const createRateLimiter = (windowMs, max, message) => {
    return rateLimit({
        windowMs,
        max,
        message: {
            error: 'Rate limit exceeded',
            message,
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: Math.ceil(windowMs / 1000)
        },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
            res.status(429).json({
                error: 'Rate limit exceeded',
                message,
                code: 'RATE_LIMIT_EXCEEDED',
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }
    });
};

// Different rate limits for different endpoints
const basicLimiter = createRateLimiter(60 * 1000, 10, 'Basic plan: 10 requests per minute');
const proLimiter = createRateLimiter(60 * 1000, 100, 'Pro plan: 100 requests per minute');
const enterpriseLimiter = createRateLimiter(60 * 1000, 1000, 'Enterprise plan: 1000 requests per minute');

// Rate limiting middleware based on subscription tier
const rateLimitBySubscription = (req, res, next) => {
    const subscription = req.headers['x-rapidapi-subscription'] || 'basic';

    switch (subscription.toLowerCase()) {
        case 'enterprise':
            return enterpriseLimiter(req, res, next);
        case 'pro':
            return proLimiter(req, res, next);
        default:
            return basicLimiter(req, res, next);
    }
};

// Country validation - ISO 3166-1 alpha-2 codes
const VALID_COUNTRIES = [
    'AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AO', 'AQ', 'AR', 'AS', 'AT', 'AU', 'AW', 'AX', 'AZ',
    'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI', 'BJ', 'BL', 'BM', 'BN', 'BO', 'BQ', 'BR', 'BS',
    'BT', 'BV', 'BW', 'BY', 'BZ', 'CA', 'CC', 'CD', 'CF', 'CG', 'CH', 'CI', 'CK', 'CL', 'CM', 'CN',
    'CO', 'CR', 'CU', 'CV', 'CW', 'CX', 'CY', 'CZ', 'DE', 'DJ', 'DK', 'DM', 'DO', 'DZ', 'EC', 'EE',
    'EG', 'EH', 'ER', 'ES', 'ET', 'FI', 'FJ', 'FK', 'FM', 'FO', 'FR', 'GA', 'GB', 'GD', 'GE', 'GF',
    'GG', 'GH', 'GI', 'GL', 'GM', 'GN', 'GP', 'GQ', 'GR', 'GS', 'GT', 'GU', 'GW', 'GY', 'HK', 'HM',
    'HN', 'HR', 'HT', 'HU', 'ID', 'IE', 'IL', 'IM', 'IN', 'IO', 'IQ', 'IR', 'IS', 'IT', 'JE', 'JM',
    'JO', 'JP', 'KE', 'KG', 'KH', 'KI', 'KM', 'KN', 'KP', 'KR', 'KW', 'KY', 'KZ', 'LA', 'LB', 'LC',
    'LI', 'LK', 'LR', 'LS', 'LT', 'LU', 'LV', 'LY', 'MA', 'MC', 'MD', 'ME', 'MF', 'MG', 'MH', 'MK',
    'ML', 'MM', 'MN', 'MO', 'MP', 'MQ', 'MR', 'MS', 'MT', 'MU', 'MV', 'MW', 'MX', 'MY', 'MZ', 'NA',
    'NC', 'NE', 'NF', 'NG', 'NI', 'NL', 'NO', 'NP', 'NR', 'NU', 'NZ', 'OM', 'PA', 'PE', 'PF', 'PG',
    'PH', 'PK', 'PL', 'PM', 'PN', 'PR', 'PS', 'PT', 'PW', 'PY', 'QA', 'RE', 'RO', 'RS', 'RU', 'RW',
    'SA', 'SB', 'SC', 'SD', 'SE', 'SG', 'SH', 'SI', 'SJ', 'SK', 'SL', 'SM', 'SN', 'SO', 'SR', 'SS',
    'ST', 'SV', 'SX', 'SY', 'SZ', 'TC', 'TD', 'TF', 'TG', 'TH', 'TJ', 'TK', 'TL', 'TM', 'TN', 'TO',
    'TR', 'TT', 'TV', 'TW', 'TZ', 'UA', 'UG', 'UM', 'US', 'UY', 'UZ', 'VA', 'VC', 'VE', 'VG', 'VI',
    'VN', 'VU', 'WF', 'WS', 'YE', 'YT', 'ZA', 'ZM', 'ZW'
];

// Enhanced holiday data with more countries and years
const enhancedHolidays = {
    'US-2025': [
        { date: '2025-01-01', name: "New Year's Day", description: 'The first day of the Gregorian calendar year', type: 'public' },
        { date: '2025-01-20', name: 'Martin Luther King Jr. Day', description: 'Federal holiday honoring civil rights leader Martin Luther King Jr.', type: 'public' },
        { date: '2025-02-17', name: "Presidents' Day", description: 'Federal holiday honoring all U.S. presidents', type: 'public' },
        { date: '2025-05-26', name: 'Memorial Day', description: 'Federal holiday honoring military personnel who died in service', type: 'public' },
        { date: '2025-07-04', name: 'Independence Day', description: 'Celebration of American independence from Great Britain', type: 'public' },
        { date: '2025-09-01', name: 'Labor Day', description: 'Federal holiday celebrating the contributions of workers', type: 'public' },
        { date: '2025-10-13', name: 'Columbus Day', description: 'Federal holiday commemorating Christopher Columbus', type: 'public' },
        { date: '2025-11-11', name: 'Veterans Day', description: 'Federal holiday honoring military veterans', type: 'public' },
        { date: '2025-11-27', name: 'Thanksgiving Day', description: 'Federal holiday for giving thanks and sharing meals with family', type: 'public' },
        { date: '2025-12-25', name: 'Christmas Day', description: 'Christian holiday celebrating the birth of Jesus Christ', type: 'public' }
    ],
    'GB-2025': [
        { date: '2025-01-01', name: "New Year's Day", description: 'The first day of the Gregorian calendar year', type: 'public' },
        { date: '2025-04-18', name: 'Good Friday', description: 'Christian holiday commemorating the crucifixion of Jesus', type: 'public' },
        { date: '2025-04-21', name: 'Easter Monday', description: 'Christian holiday celebrating the resurrection of Jesus', type: 'public' },
        { date: '2025-05-05', name: 'Early May Bank Holiday', description: 'Spring bank holiday in the UK', type: 'bank' },
        { date: '2025-05-26', name: 'Spring Bank Holiday', description: 'Late spring bank holiday in the UK', type: 'bank' },
        { date: '2025-08-25', name: 'Summer Bank Holiday', description: 'Summer bank holiday in England, Wales, and Northern Ireland', type: 'bank' },
        { date: '2025-12-25', name: 'Christmas Day', description: 'Christian holiday celebrating the birth of Jesus Christ', type: 'public' },
        { date: '2025-12-26', name: 'Boxing Day', description: 'Traditional holiday following Christmas Day', type: 'public' }
    ],
    'CA-2025': [
        { date: '2025-01-01', name: "New Year's Day", description: 'The first day of the Gregorian calendar year', type: 'public' },
        { date: '2025-04-18', name: 'Good Friday', description: 'Christian holiday commemorating the crucifixion of Jesus', type: 'public' },
        { date: '2025-04-21', name: 'Easter Monday', description: 'Christian holiday celebrating the resurrection of Jesus', type: 'public' },
        { date: '2025-05-19', name: 'Victoria Day', description: 'Canadian federal holiday honoring Queen Victoria', type: 'public' },
        { date: '2025-07-01', name: 'Canada Day', description: 'National holiday celebrating Canadian Confederation', type: 'public' },
        { date: '2025-09-01', name: 'Labour Day', description: 'Federal holiday celebrating the contributions of workers', type: 'public' },
        { date: '2025-10-13', name: 'Thanksgiving', description: 'Canadian holiday for giving thanks', type: 'public' },
        { date: '2025-11-11', name: 'Remembrance Day', description: 'Memorial day for military personnel who died in service', type: 'public' },
        { date: '2025-12-25', name: 'Christmas Day', description: 'Christian holiday celebrating the birth of Jesus Christ', type: 'public' },
        { date: '2025-12-26', name: 'Boxing Day', description: 'Traditional holiday following Christmas Day', type: 'public' }
    ],
    'DE-2025': [
        { date: '2025-01-01', name: "New Year's Day", description: 'The first day of the Gregorian calendar year', type: 'public' },
        { date: '2025-05-01', name: 'Labour Day', description: 'German holiday celebrating workers', type: 'public' },
        { date: '2025-10-03', name: 'German Unity Day', description: 'National holiday commemorating German reunification', type: 'public' },
        { date: '2025-12-25', name: 'Christmas Day', description: 'Christian holiday celebrating the birth of Jesus Christ', type: 'public' },
        { date: '2025-12-26', name: 'Boxing Day', description: 'Second day of Christmas', type: 'public' }
    ],
    'FR-2025': [
        { date: '2025-01-01', name: "New Year's Day", description: 'The first day of the Gregorian calendar year', type: 'public' },
        { date: '2025-05-01', name: 'Labour Day', description: 'French holiday celebrating workers', type: 'public' },
        { date: '2025-05-08', name: 'Victory in Europe Day', description: 'Commemorates the end of World War II in Europe', type: 'public' },
        { date: '2025-07-14', name: 'Bastille Day', description: 'French National Day', type: 'public' },
        { date: '2025-08-15', name: 'Assumption Day', description: 'Christian holiday', type: 'public' },
        { date: '2025-11-01', name: 'All Saints Day', description: 'Christian holiday honoring all saints', type: 'public' },
        { date: '2025-11-11', name: 'Armistice Day', description: 'Commemorates the end of World War I', type: 'public' },
        { date: '2025-12-25', name: 'Christmas Day', description: 'Christian holiday celebrating the birth of Jesus Christ', type: 'public' }
    ]
};

// Enhanced ICS generation functions
function generateUID(holiday, country, year) {
    const dateStr = holiday.date.replace(/-/g, '');
    const nameHash = holiday.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    return `${dateStr}-${nameHash}-${country}-${year}@holiday-calendar-api.com`;
}

function formatDate(dateStr) {
    return dateStr.replace(/-/g, '');
}

function formatDateTimeUTC(date) {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function escapeText(text) {
    return text
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '');
}

function generateICS(holidays, options) {
    const { country, year, region } = options;

    const calendarName = region
        ? `${country}-${region} Public Holidays ${year}`
        : `${country} Public Holidays ${year}`;

    const prodId = `-//Holiday Calendar API//Holiday Calendar ${year}//EN`;
    const now = new Date();
    const timestamp = formatDateTimeUTC(now);

    let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        `PRODID:${prodId}`,
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        `X-WR-CALNAME:${calendarName}`,
        'X-WR-CALDESC:Public holidays calendar generated by Holiday Calendar API',
        'X-WR-TIMEZONE:UTC',
        'X-PUBLISHED-TTL:PT1H',
        'X-ORIGINAL-URL:https://rapidapi.com/holiday-calendar-api'
    ];

    holidays.forEach(holiday => {
        const uid = generateUID(holiday, country, year);
        const dtstart = formatDate(holiday.date);

        icsContent.push(
            'BEGIN:VEVENT',
            `UID:${uid}`,
            `DTSTAMP:${timestamp}`,
            `DTSTART;VALUE=DATE:${dtstart}`,
            `SUMMARY:${escapeText(holiday.name)}`,
            'STATUS:CONFIRMED',
            'TRANSP:TRANSPARENT',
            'CLASS:PUBLIC',
            'PRIORITY:5'
        );

        if (holiday.description) {
            icsContent.push(`DESCRIPTION:${escapeText(holiday.description)}`);
        }

        const category = holiday.type.toUpperCase();
        icsContent.push(`CATEGORIES:${category},HOLIDAY`);

        if (holiday.observed && holiday.observed !== holiday.date) {
            icsContent.push(`X-OBSERVED-DATE:${formatDate(holiday.observed)}`);
        }

        icsContent.push('END:VEVENT');
    });

    icsContent.push('END:VCALENDAR');

    return icsContent.join('\r\n');
}

// Enhanced holiday fetching with multiple sources
async function fetchHolidays(country, year, region) {
    try {
        // Try multiple external APIs for comprehensive data
        const apis = [
            `https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`,
            `https://holidayapi.com/v1/holidays?country=${country}&year=${year}`,
            `https://calendarific.com/api/v2/holidays?country=${country}&year=${year}`
        ];

        for (const apiUrl of apis) {
            try {
                const response = await axios.get(apiUrl, { timeout: 3000 });

                if (response.data && Array.isArray(response.data)) {
                    return response.data.map(holiday => ({
                        date: holiday.date,
                        name: holiday.name,
                        description: holiday.localName !== holiday.name ? holiday.localName : undefined,
                        type: holiday.types?.includes('Public') ? 'public' : 'bank'
                    }));
                }
            } catch (error) {
                logger.debug(`API ${apiUrl} failed: ${error.message}`);
                continue;
            }
        }
    } catch (error) {
        logger.warn(`All external APIs failed for ${country}-${year}: ${error.message}`);
    }

    // Fallback to enhanced sample data
    const key = `${country}-${year}`;
    return enhancedHolidays[key] || [];
}

// Enhanced validation middleware
function validateHolidayRequest(req, res, next) {
    const { country, year, region } = req.query;

    if (!country) {
        return res.status(400).json({
            error: 'Missing required parameter',
            message: 'Parameter "country" is required',
            code: 'MISSING_COUNTRY',
            documentation: 'https://rapidapi.com/holiday-calendar-api/docs'
        });
    }

    if (!VALID_COUNTRIES.includes(country.toUpperCase())) {
        return res.status(400).json({
            error: 'Invalid country code',
            message: `Country code "${country}" is not a valid ISO 3166-1 alpha-2 code`,
            code: 'INVALID_COUNTRY',
            validCountries: VALID_COUNTRIES.slice(0, 10),
            documentation: 'https://rapidapi.com/holiday-calendar-api/docs'
        });
    }

    if (!year) {
        return res.status(400).json({
            error: 'Missing required parameter',
            message: 'Parameter "year" is required',
            code: 'MISSING_YEAR',
            documentation: 'https://rapidapi.com/holiday-calendar-api/docs'
        });
    }

    const yearInt = parseInt(year);
    if (isNaN(yearInt) || yearInt < 2000 || yearInt > 2030) {
        return res.status(400).json({
            error: 'Invalid year',
            message: 'Year must be a valid integer between 2000 and 2030',
            code: 'INVALID_YEAR',
            documentation: 'https://rapidapi.com/holiday-calendar-api/docs'
        });
    }

    req.validatedQuery = {
        country: country.toUpperCase(),
        year: yearInt,
        region: region?.toUpperCase()
    };

    next();
}

// Routes with enhanced features

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'production',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        rapidapi: true
    });
});

app.get('/docs', (req, res) => {
    res.json({
        name: 'Holiday Calendar API',
        version: '1.0.0',
        description: 'Professional REST API for generating iCalendar (ICS) files with public holidays worldwide',
        rapidapi: {
            marketplace: 'https://rapidapi.com/holiday-calendar-api',
            pricing: {
                basic: '10 requests/minute',
                pro: '100 requests/minute',
                enterprise: '1000 requests/minute'
            }
        },
        endpoints: {
            'GET /holidays': {
                description: 'Generate ICS calendar file for public holidays',
                parameters: {
                    country: {
                        type: 'string',
                        required: true,
                        description: 'ISO 3166-1 alpha-2 country code (e.g., "US", "GB", "CA")'
                    },
                    year: {
                        type: 'integer',
                        required: true,
                        description: 'Year for holidays (2000-2030)'
                    },
                    region: {
                        type: 'string',
                        required: false,
                        description: 'Optional region code (e.g., "CA" for California)'
                    }
                },
                responses: {
                    200: 'ICS calendar file (text/calendar)',
                    400: 'Invalid parameters',
                    429: 'Rate limit exceeded',
                    500: 'Internal server error'
                },
                examples: {
                    'US holidays for 2025': '/holidays?country=US&year=2025',
                    'UK holidays for 2025': '/holidays?country=GB&year=2025',
                    'Canadian holidays for 2025': '/holidays?country=CA&year=2025'
                }
            }
        },
        features: [
            'RFC 5545 compliant ICS generation',
            '100+ countries supported',
            'Professional rate limiting',
            'Multiple data sources',
            'Comprehensive error handling',
            'Production-ready logging'
        ]
    });
});

app.get('/holidays', rateLimitBySubscription, validateHolidayRequest, async (req, res) => {
    const { country, year, region } = req.validatedQuery;

    try {
        logger.info(`Generating holidays for ${country}-${year}${region ? `-${region}` : ''}`, {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            subscription: req.headers['x-rapidapi-subscription'] || 'basic'
        });

        const holidays = await fetchHolidays(country, year, region);

        if (!holidays.length) {
            return res.status(404).json({
                error: 'No holidays found',
                message: `No holiday data available for ${country} in ${year}`,
                code: 'NO_HOLIDAYS_FOUND',
                documentation: 'https://rapidapi.com/holiday-calendar-api/docs'
            });
        }

        const icsContent = generateICS(holidays, { country, year, region });

        const filename = region
            ? `holidays-${country}-${region}-${year}.ics`
            : `holidays-${country}-${year}.ics`;

        res.set({
            'Content-Type': 'text/calendar; charset=utf-8',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Cache-Control': 'public, max-age=86400',
            'X-Holidays-Count': holidays.length.toString(),
            'X-Country': country,
            'X-Year': year.toString(),
            'X-API-Version': '1.0.0',
            'X-RapidAPI-Service': 'Holiday Calendar API'
        });

        if (region) {
            res.set('X-Region', region);
        }

        logger.info(`Successfully generated ${holidays.length} holidays for ${country}-${year}`, {
            country,
            year,
            region,
            holidayCount: holidays.length
        });

        res.send(icsContent);

    } catch (error) {
        logger.error('Error generating holidays:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'An error occurred while generating the holiday calendar',
            code: 'INTERNAL_ERROR',
            documentation: 'https://rapidapi.com/holiday-calendar-api/docs',
            support: 'https://rapidapi.com/holiday-calendar-api/support'
        });
    }
});

app.get('/countries', (req, res) => {
    res.json({
        countries: VALID_COUNTRIES,
        count: VALID_COUNTRIES.length,
        note: 'These are ISO 3166-1 alpha-2 country codes. Holiday data availability may vary by country.',
        rapidapi: {
            marketplace: 'https://rapidapi.com/holiday-calendar-api',
            documentation: 'https://rapidapi.com/holiday-calendar-api/docs'
        }
    });
});

// Enhanced error handling
app.use((err, req, res, next) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
        documentation: 'https://rapidapi.com/holiday-calendar-api/docs',
        support: 'https://rapidapi.com/holiday-calendar-api/support'
    });
});

app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        message: `Endpoint ${req.method} ${req.path} not found`,
        code: 'ENDPOINT_NOT_FOUND',
        availableEndpoints: ['/health', '/docs', '/holidays', '/countries'],
        documentation: 'https://rapidapi.com/holiday-calendar-api/docs'
    });
});

// Start server
app.listen(PORT, () => {
    logger.info(`Holiday Calendar API server running on port ${PORT}`, {
        environment: process.env.NODE_ENV || 'production',
        rapidapi: true,
        version: '1.0.0'
    });

    console.log(`
🚀 Holiday Calendar API - Production Ready for RapidAPI!

📍 Server running on: http://localhost:${PORT}
📖 API Documentation: http://localhost:${PORT}/docs
💚 Health Check: http://localhost:${PORT}/health
🌍 Countries Supported: ${VALID_COUNTRIES.length}
🔒 Rate Limiting: Enabled with subscription tiers
📊 Production Logging: Enabled
🛡️ Security: Enhanced with Helmet.js

Ready for RapidAPI deployment and monetization!
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});

module.exports = app;

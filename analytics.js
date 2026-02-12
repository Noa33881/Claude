const Database = require('better-sqlite3');
const geoip = require('geoip-lite');
const path = require('path');

// Initialize database
const db = new Database(path.join(__dirname, 'analytics.db'));

// Create tables
db.exec(`
    CREATE TABLE IF NOT EXISTS visits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip_address TEXT NOT NULL,
        country TEXT,
        country_code TEXT,
        city TEXT,
        region TEXT,
        user_agent TEXT,
        page TEXT,
        referrer TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS searches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        server_id TEXT NOT NULL,
        ip_address TEXT,
        country TEXT,
        success BOOLEAN DEFAULT 1,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_visits_timestamp ON visits(timestamp);
    CREATE INDEX IF NOT EXISTS idx_visits_country ON visits(country_code);
    CREATE INDEX IF NOT EXISTS idx_searches_timestamp ON searches(timestamp);
`);

// Prepared statements for better performance
const insertVisit = db.prepare(`
    INSERT INTO visits (ip_address, country, country_code, city, region, user_agent, page, referrer)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertSearch = db.prepare(`
    INSERT INTO searches (server_id, ip_address, country, success)
    VALUES (?, ?, ?, ?)
`);

// Get IP geolocation info
function getGeoInfo(ip) {
    // Handle localhost/private IPs
    if (ip === '::1' || ip === '127.0.0.1' || ip === 'localhost' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
        return {
            country: 'Local',
            country_code: 'LOCAL',
            city: 'Localhost',
            region: 'Local'
        };
    }

    const geo = geoip.lookup(ip);
    if (geo) {
        return {
            country: geo.country,
            country_code: geo.country,
            city: geo.city || 'Unknown',
            region: geo.region || 'Unknown'
        };
    }

    return {
        country: 'Unknown',
        country_code: 'XX',
        city: 'Unknown',
        region: 'Unknown'
    };
}

// Extract real IP from request
function getRealIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0] ||
           req.headers['x-real-ip'] ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           req.ip ||
           'Unknown';
}

// Track page visit
function trackVisit(req, page = '/') {
    try {
        const ip = getRealIP(req);
        const geo = getGeoInfo(ip);
        const userAgent = req.headers['user-agent'] || 'Unknown';
        const referrer = req.headers['referer'] || req.headers['referrer'] || 'Direct';

        insertVisit.run(
            ip,
            geo.country,
            geo.country_code,
            geo.city,
            geo.region,
            userAgent,
            page,
            referrer
        );

        console.log(`📊 Visit tracked: ${ip} (${geo.country}) - ${page}`);
    } catch (error) {
        console.error('Error tracking visit:', error);
    }
}

// Track search
function trackSearch(req, serverId, success = true) {
    try {
        const ip = getRealIP(req);
        const geo = getGeoInfo(ip);

        insertSearch.run(
            serverId,
            ip,
            geo.country,
            success ? 1 : 0
        );

        console.log(`🔍 Search tracked: ${serverId} from ${ip} (${geo.country})`);
    } catch (error) {
        console.error('Error tracking search:', error);
    }
}

// Get statistics
function getStats(days = 7) {
    try {
        const stats = {};

        // Total visits
        stats.totalVisits = db.prepare(`
            SELECT COUNT(*) as count FROM visits
        `).get().count;

        // Total searches
        stats.totalSearches = db.prepare(`
            SELECT COUNT(*) as count FROM searches
        `).get().count;

        // Visits today
        stats.visitsToday = db.prepare(`
            SELECT COUNT(*) as count FROM visits
            WHERE DATE(timestamp) = DATE('now')
        `).get().count;

        // Visits this week
        stats.visitsThisWeek = db.prepare(`
            SELECT COUNT(*) as count FROM visits
            WHERE timestamp >= DATE('now', '-7 days')
        `).get().count;

        // Top countries
        stats.topCountries = db.prepare(`
            SELECT country, country_code, COUNT(*) as count
            FROM visits
            WHERE country IS NOT NULL
            GROUP BY country, country_code
            ORDER BY count DESC
            LIMIT 10
        `).all();

        // Daily visits (last 30 days)
        stats.dailyVisits = db.prepare(`
            SELECT DATE(timestamp) as date, COUNT(*) as count
            FROM visits
            WHERE timestamp >= DATE('now', '-30 days')
            GROUP BY DATE(timestamp)
            ORDER BY date ASC
        `).all();

        // Hourly visits (last 24 hours)
        stats.hourlyVisits = db.prepare(`
            SELECT strftime('%H:00', timestamp) as hour, COUNT(*) as count
            FROM visits
            WHERE timestamp >= DATETIME('now', '-24 hours')
            GROUP BY strftime('%H', timestamp)
            ORDER BY hour ASC
        `).all();

        // Top searched servers
        stats.topServers = db.prepare(`
            SELECT server_id, COUNT(*) as count
            FROM searches
            GROUP BY server_id
            ORDER BY count DESC
            LIMIT 10
        `).all();

        // Recent visits
        stats.recentVisits = db.prepare(`
            SELECT ip_address, country, country_code, city, page, timestamp
            FROM visits
            ORDER BY timestamp DESC
            LIMIT 20
        `).all();

        return stats;
    } catch (error) {
        console.error('Error getting stats:', error);
        return null;
    }
}

// Clean old data (keep last 90 days)
function cleanOldData() {
    try {
        db.prepare(`DELETE FROM visits WHERE timestamp < DATE('now', '-90 days')`).run();
        db.prepare(`DELETE FROM searches WHERE timestamp < DATE('now', '-90 days')`).run();
        console.log('🧹 Old analytics data cleaned');
    } catch (error) {
        console.error('Error cleaning old data:', error);
    }
}

// Run cleanup daily
setInterval(cleanOldData, 24 * 60 * 60 * 1000);

module.exports = {
    trackVisit,
    trackSearch,
    getStats,
    getRealIP
};

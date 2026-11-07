const SANTIAGO_TIME_ZONE = 'America/Santiago';

function getSantiagoDateKey(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: SANTIAGO_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
}

function parseDateOnly(value) {
    if (!value) return null;
    const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return null;
    const key = `${match[1]}-${match[2]}-${match[3]}`;
    const date = new Date(`${key}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== key) return null;
    return date;
}

function todayAsUtcDate() {
    return parseDateOnly(getSantiagoDateKey());
}

function addUtcDays(date, days) {
    const result = new Date(date);
    result.setUTCDate(result.getUTCDate() + days);
    return result;
}

function activeIdeaWhere(today = todayAsUtcDate()) {
    return {
        OR: [
            { fecha: null },
            { fechaFin: { gte: today } },
            { AND: [{ fechaFin: null }, { fecha: { gte: today } }] }
        ]
    };
}

function expiredIdeaWhere(today = todayAsUtcDate()) {
    return {
        fecha: { not: null },
        OR: [
            { fechaFin: { lt: today } },
            { AND: [{ fechaFin: null }, { fecha: { lt: today } }] }
        ]
    };
}

module.exports = {
    SANTIAGO_TIME_ZONE,
    getSantiagoDateKey,
    parseDateOnly,
    todayAsUtcDate,
    addUtcDays,
    activeIdeaWhere,
    expiredIdeaWhere
};

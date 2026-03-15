const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

exports.prisma = prisma;

exports.validateLength = (str, min, max) => {
    return str.length >= min && str.length <= max;
}

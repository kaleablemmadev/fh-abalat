/* src/lib/EthiopianDateTests/ethDateTest.ts */
import prisma from "../prisma";
import { ethiopianDateToWords } from "../ethiopiancal";

const memberId = "cmrny2df3000404jrxe5nsk5p";


async function fetchCreatedAt(memberId: string) {
    const user = await prisma.user.findUnique({
        where: {
            id: memberId,
        },
        select: {
            createdAt: true,
        },
    });

    if (!user) {
        throw new Error("User not found");
    } else {
        const createdAt = new Date(user.createdAt);
        const dateOnly = createdAt.toISOString().split("T")[0];
        const ethYear = dateOnly.split("-")[0];
        const ethMonth = dateOnly.split("-")[1];
        const ethDay = dateOnly.split("-")[2];

        const ethiopianDate = {
            year: parseInt(ethYear, 10),
            month: parseInt(ethMonth, 10),
            day: parseInt(ethDay, 10),
        };

        return ethiopianDate;
    }
}

const ethDate = await fetchCreatedAt(memberId);

console.log(ethiopianDateToWords(ethDate))
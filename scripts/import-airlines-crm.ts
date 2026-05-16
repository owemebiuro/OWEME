import { PrismaClient } from "@prisma/client";

import { airlineCrmData } from "../lib/airlines/airline-crm-data";
import { getAirlinePrismaData } from "../lib/airlines/airline-prisma";

const prisma = new PrismaClient();

async function main() {
  for (const airline of airlineCrmData) {
    await prisma.airline.upsert({
      where: {
        iataCode: airline.iata,
      },
      update: getAirlinePrismaData(airline.iata),
      create: {
        iataCode: airline.iata,
        ...getAirlinePrismaData(airline.iata),
      },
    });
  }

  console.log(`Zaimportowano dane CRM linii lotniczych: ${airlineCrmData.length}.`);
}

main()
  .catch((error) => {
    console.error("Import danych CRM linii lotniczych nie powiódł się.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

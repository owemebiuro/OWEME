export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    mapped: {
      flightNumber: "LO123",
      flightDate: "2024-03-15",
      departureAirportCode: "WAW",
      arrivalAirportCode: "LHR",
      scheduledDeparture: "2024-03-15T10:00:00.000Z",
      actualDeparture: "2024-03-15T10:35:00.000Z",
      scheduledArrival: "2024-03-15T12:45:00.000Z",
      actualArrival: "2024-03-15T16:50:00.000Z",
      delayMinutes: 245,
      flightStatus: "LANDED",
      airlineIata: "LO",
      airlineName: "LOT Polish Airlines",
      dataSource: "MANUAL",
    },
    aviationStackLike: {
      data: [
        {
          flight_date: "2024-03-15",
          flight_status: "landed",
          departure: {
            iata: "WAW",
            scheduled: "2024-03-15T10:00:00+00:00",
            actual: "2024-03-15T10:35:00+00:00",
            delay: 35,
          },
          arrival: {
            iata: "LHR",
            scheduled: "2024-03-15T12:45:00+00:00",
            actual: "2024-03-15T16:50:00+00:00",
            delay: 245,
          },
          airline: {
            name: "LOT Polish Airlines",
            iata: "LO",
          },
          flight: {
            iata: "LO123",
          },
        },
      ],
    },
    aeroDataBoxLike: [
      {
        number: "LO123",
        status: "Arrived",
        airline: {
          name: "LOT Polish Airlines",
          iata: "LO",
        },
        departure: {
          airport: {
            iata: "WAW",
          },
          scheduledTime: {
            utc: "2024-03-15T10:00:00.000Z",
          },
          actualTime: {
            utc: "2024-03-15T10:35:00.000Z",
          },
        },
        arrival: {
          airport: {
            iata: "LHR",
          },
          scheduledTime: {
            utc: "2024-03-15T12:45:00.000Z",
          },
          actualTime: {
            utc: "2024-03-15T16:50:00.000Z",
          },
        },
      },
    ],
  });
}

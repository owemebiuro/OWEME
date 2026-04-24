export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    examples: {
      shortHaul250: {
        flightNumber: "LO123",
        date: "2024-03-15",
        expectedAmount: 250,
        expectedDistanceKm: 1450,
      },
      mediumHaul400: {
        flightNumber: "FR456",
        date: "2024-04-02",
        expectedAmount: 400,
        expectedDistanceKm: 1675,
      },
      longHaul600: {
        flightNumber: "EK204",
        date: "2024-05-10",
        expectedAmount: 600,
        expectedDistanceKm: 11020,
      },
      notFound: {
        flightNumber: "ZZ9999",
        date: "2024-03-15",
        expectedFound: false,
      },
    },
    flightAwareLike: {
      flights: [
        {
          fa_flight_id: "lot-1710496800-airline-0123",
          ident: "LOT123",
          ident_iata: "LO123",
          operator_iata: "LO",
          operator_name: "LOT Polish Airlines",
          origin: {
            code_iata: "WAW",
            name: "Warsaw Chopin Airport",
            latitude: 52.1657,
            longitude: 20.9671,
          },
          destination: {
            code_iata: "LHR",
            name: "London Heathrow Airport",
            latitude: 51.47,
            longitude: -0.4543,
          },
          scheduled_out: "2024-03-15T10:00:00Z",
          actual_out: "2024-03-15T10:20:00Z",
          scheduled_in: "2024-03-15T12:20:00Z",
          actual_in: "2024-03-15T13:10:00Z",
          status: "Arrived",
          route_distance_km: 1450,
          cancelled: false,
          diverted: false,
        },
      ],
    },
  });
}

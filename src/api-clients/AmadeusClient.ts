import Amadus from 'amadeus'
import config from '../configs/config';
import { amadeusClientType, FlightOfferSearchParams, multiCityFlightSearchParams } from '../../types/amadeusTypes';
import { routeType } from '../../types/flightTypes';
import { convertToPriceCalendar } from '../utils/flights';
import { amadeusClass } from '../../constants/cabinClass';

class AmadeusClient {
  private client: amadeusClientType;

  constructor() {
    this.client = new Amadus({
      clientId: process.env.AMADEUS_CLIENT_ID,
      clientSecret: process.env.AMADEUS_CLIENT_SECRET,
      hostname: 'production'
    });
  }

  async citySearch(query: string, subType: string) {
    try {
      const response = await this.client.referenceData.locations.get({
        keyword: query,
        subType: subType
      });

      return response.body
    } catch (error) {
      console.log("Failed to fetch city search", error)
      throw error
    }
  }

  async priceCalendar(params: { origin: string, destination: string, date1: string, date2: string, oneWay?: boolean }): Promise<any> {
    try {
      const payload = {
        origin: params.origin,
        destination: params.destination,
        departureDate: `${params.date1}${params.date2 ? `,${params.date2}` : ''}`,
        oneWay: params.oneWay || false,
      }
      console.log("Payload: ", payload);
      const response = await this.client.shopping.flightDates.get(payload)
      // const priceCalendar = convertToPriceCalendar(response.data);

      return response.data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async searchFlights(params: FlightOfferSearchParams, index: number): Promise<any> {
    try {

      await new Promise(resolve => setTimeout(resolve, 100 * (index)))

      // const response = await this.client.shopping.flightOffersSearch.post(JSON.stringify({
      //   originDestinations: [
      //     {
      //       originLocationCode: params.locationDeparture,
      //       destinationLocationCode: params.locationArrival,
      //       departureDateTimeRange: {
      //         date: params.departure,
      //         // time: "10:00:00"
      //       }
      //     }
      //   ],
      //   searchCriteria: {
      //     addOneWayOffers: true
      //   },
      //   adults: 1,
      // }));

      const response = await this.client.shopping.flightOffersSearch.post(JSON.stringify({
        currencyCode: "EUR",
        originDestinations: [
          {
            id: 1,
            originLocationCode: params.locationDeparture,
            destinationLocationCode: params.locationArrival,
            departureDateTimeRange: {
              date: params.departure,
              // time: 10:00:00
            }
          },
        ],
        travelers: params.passengers,
        sources: [
          "GDS"
        ],
        searchCriteria: {
          maxFlightOffers: 50,
          flightFilters: {
            cabinRestrictions: [
              {
                cabin: amadeusClass[params.cabinClass],
                coverage: "MOST_SEGMENTS",
                originDestinationIds: [
                  1
                ]
              }
            ],
            // carrierRestrictions: {
            //   excludedCarrierCodes: [
            //     AA,
            //     TP,
            //     AZ
            //   ]
            // }
          }
        }
      }))
      return { data: response.data, dictionaries: response.result.dictionaries };
    } catch (error) {
      throw error;
    }
  }

  async multiCityFlightSearch({ routeSegments, departureDate, passengers, index }: multiCityFlightSearchParams): Promise<any> {
    try {
      const segments = routeSegments.map((routeSegment, index) => {
        return {
          id: index + 1,
          originLocationCode: routeSegment.origin,
          destinationLocationCode: routeSegment.destination,
          // departureDate: new Date().toISOString().split('T')[0],
          departureDateTimeRange: {
            date: departureDate
          },
        }
      })
      console.log(index);
      await new Promise(resolve => setTimeout(resolve, 100 * (index + 1)))
      console.log("Resolved ", index)
      const response = await this.client.shopping.flightOffersSearch.post(JSON.stringify({
        originDestinations: segments,
        // adults: passengers
        travelers: [
          {
            "id": "1",
            "travelerType": "ADULT",
            "fareOptions": [
              "STANDARD"
            ]
          },
          {
            "id": "2",
            "travelerType": "CHILD",
            "fareOptions": [
              "STANDARD"
            ]
          }
        ],
        sources: [
          "GDS"
        ],
      }))
      return { data: response.data, dictionaries: response.result.dictionaries };
    } catch (error) {
      console.log(error)
    }
  }

  async flightPrice(params: FlightOfferSearchParams): Promise<any> {
    try {
      const flightOffersSearchResponse = await this.client.shopping.flightOffersSearch.get({
        originLocationCode: params.locationDeparture,
        destinationLocationCode: params.locationArrival,
        departureDate: params.departure,
        adults: params.adults,
      });
      const flightOffer = flightOffersSearchResponse.data[0];
      // const flightOffer = flightOffersSearchResponse.data.reduce((min, offer) => offer.price < min.price ? offer : min);
      const flightPricingResponse = await this.client.shopping.flightOffers.pricing.post(
        JSON.stringify({
          'data': {
            'type': 'flight-offers-pricing',
            'flightOffers': [flightOffer]
          }
        }), { include: 'credit-card-fees,detailed-fare-rules' }
      );

      return flightPricingResponse.data;
    } catch (error) {
      throw error;
    }
  }

  async bookingFlight() {
    try {
      const response = await this.client.booking.flightOrders.post({
        data: {
          type: "flight-order",
          // flightOffers: [pricingResponse.data.flightOffers[0]],
          travelers: [
            {
              id: "1",
              dateOfBirth: "1982-01-16",
              name: {
                firstName: "JORGE",
                lastName: "GONZALES",
              },
              gender: "MALE",
              contact: {
                emailAddress: "jorge.gonzales833@telefonica.es",
                phones: [
                  {
                    deviceType: "MOBILE",
                    countryCallingCode: "34",
                    number: "480080076",
                  },
                ],
              },
              documents: [
                {
                  documentType: "PASSPORT",
                  birthPlace: "Madrid",
                  issuanceLocation: "Madrid",
                  issuanceDate: "2015-04-14",
                  number: "00000000",
                  expiryDate: "2025-04-14",
                  issuanceCountry: "ES",
                  validityCountry: "ES",
                  nationality: "ES",
                  holder: true,
                },
              ],
            },
          ],
        },
      });
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export type AmadeusClientInstance = InstanceType<typeof AmadeusClient>;
export default AmadeusClient;

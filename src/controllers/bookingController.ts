import { Request, Response } from "express";
import { prisma } from "../prismaClient";
import { AuthenticatedRequest } from "../../types/express";

const adminStatus = {
  TICKETED: "Confirmed",
  PENDING_TICKET: "Pending",
  PENDING_PAYMENT: "Pending",
  EXPIRED: "Cancelled",
  FAILED_BOOKING: "Cancelled",
};

export const addBooking = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user.id;

  if (!userId) {
    return res
      .status(403)
      .json({ error: "Unauthorized access", success: false });
  }

  const data = req.body;
  data.userId = userId;

  try {
    const booking = await prisma.booking.create({
      data: data,
    });

    const payment = await prisma.bookPayment.create({
      data: {
        bookingId: booking.id,
        totalAmount: data.totalAmount,
        currency: data.currency,
        paymentType: "",
      },
    });

    let discount;

    const discountData =
      typeof booking.discount === "string"
        ? JSON.parse(booking.discount)
        : booking.discount;
    if (discountData?.code) {
      discount = await prisma.deals.findUnique({
        where: {
          code: data.discount?.code,
        },
      });
    }

    if (discount) {
      let used = discount.used + 1;

      await prisma.deals.update({
        where: {
          code: data.discount?.code,
        },
        data: {
          used: used,
          userId: [data.userId],
        },
      });

      return res.json({
        message: "Booking confirmed and discount applied",
        booking: booking.id,
        payment: payment.id,
        success: true,
      });
    }

    return res.status(200).json({
      message: "Booking confirmed",
      booking: booking.id,
      payment: payment.id,
      success: true,
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    return res
      .status(500)
      .json({ error: "Failed to create booking", success: false });
  }
};

export const fetchBooking = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const userId = req.user.id;

  if (!userId) {
    return res
      .status(403)
      .json({ error: "Unauthorized access", success: false });
  }

  try {
    const booking = await prisma.booking.findMany();

    if (!booking) {
      return res
        .status(404)
        .json({ error: "Booking not found", success: false });
    }

    //     "booking": {
    //       "from": "Chennai",
    //       "to": "Jabalpur",
    //       "status": "Completed",
    //       "type": "Round Trip Flight",
    //       "bookingId": "NF7A9EF25118309251"
    //     },
    //     "departure": {
    //       "date": "Thu, 22 Aug",
    //       "departureTime": "04:45 AM",
    //       "arrivalTime": "11:45 AM",
    //       "from": {
    //         "code": "MAA",
    //         "city": "Chennai",
    //         "terminal": "Terminal 1"
    //       },
    //       "to": {
    //         "code": "JLR",
    //         "city": "Jabalpur"
    //       },
    //       "flightNumbers": [
    //         "6E 5093",
    //         "6E 791"
    //       ],
    //       "passenger": "Aditya kumar",
    //       "pnr": "K37KMQ"
    //     },
    //     "return": {
    //       "date": "Sun, 01 Sep",
    //       "departureTime": "12:15 PM",
    //       "arrivalTime": "07:10 PM",
    //       "from": {
    //         "code": "JLR",
    //         "city": "Jabalpur"
    //       },
    //       "to": {
    //         "code": "MAA",
    //         "city": "Chennai",
    //         "terminal": "Terminal 1"
    //       },
    //       "flightNumbers": [
    //         "6E 792",
    //         "6E 5048"
    //       ],
    //       "passenger": "Aditya kumar",
    //       "pnr": "R37KMQ"
    //     },
    //     "pricing": {
    //       "baseFare": {
    //         "adult": {
    //           "count": 1,
    //           "price": 110
    //         }
    //       },
    //       "taxes": {
    //         "airlineTaxes": 17.3,
    //         "serviceFee": 6
    //       },
    //       "otherServices": {
    //         "charity": 5
    //       },
    //       "totalRefund": 139
    //     },
    //     "userId": null
    //   }

    const updatedbooking = booking.map((data) => ({
      ...data,
      adminStatus: adminStatus[data.adminStatus],
    }));
    
    return res.status(200).json({ updatedbooking, success: true });
  } catch (error) {
    console.error("Error fetching booking:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch booking", success: false });
  }
};

export const deleteBooking = async (req: Request, res: Response) => {
  const { id } = req.body;

  try {
    await prisma.booking.delete({
      where: { id: id },
    });

    return res.status(200).json({ message: "Booking deleted", success: true });
  } catch (error) {
    console.error("Error deleting booking:", error);
    return res
      .status(500)
      .json({ error: "Failed to delete booking", success: false });
  }
};

export const updateBooking = async (req: Request, res: Response) => {
  const { id, ...data } = req.body;

  try {
    const booking = await prisma.booking.update({
      where: { id: id },
      data: data,
    });

    return res.status(200).json({ booking, success: true });
  } catch (error) {
    console.error("Error updating booking:", error);
    return res
      .status(500)
      .json({ error: "Failed to update booking", success: false });
  }
};

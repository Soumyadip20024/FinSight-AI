
import pandas as pd
from pathlib import Path


INPUT_PATH = Path("datasets/transactions_cleaned.csv")
OUTPUT_PATH = Path("datasets/transactions_expanded.csv")


# New, manually labelled transaction descriptions.
# These are synthetic examples, not real customer transactions.

NEW_DATA = {
    "Education": [
        "IIT online course enrollment fee",
        "Paid semester examination fees through UPI",
        "Purchased data structures textbook",
        "NPTEL certification examination payment",
        "College laboratory fee payment",
        "Online machine learning course purchase",
        "University admission application fee",
        "Paid coding class tuition",
        "Purchased engineering study materials",
        "Technical certification examination fee",
        "College library book purchase",
        "Academic seminar registration payment"
    ],

    "Entertainment": [
        "Booked two movie tickets at INOX",
        "PVR cinema weekend ticket payment",
        "Purchased PlayStation game online",
        "Concert entry ticket purchased online",
        "Paid for bowling at gaming arcade",
        "Booked comedy show admission ticket",
        "Bought cricket match stadium ticket",
        "Weekend amusement park entry payment",
        "Purchased theatre show ticket",
        "Online multiplayer game purchase",
        "Movie ticket payment through BookMyShow",
        "Paid for amusement park rides"
    ],

    "Food": [
        "Swiggy order for chicken biryani",
        "Zomato lunch delivery payment",
        "Dinner bill at local restaurant",
        "Paid cafe bill using Google Pay",
        "Dominos pizza online order",
        "Breakfast at roadside food stall",
        "Office canteen lunch payment",
        "Purchased sweets from local shop",
        "Tea and snacks at neighbourhood cafe",
        "Restaurant family dinner UPI payment"
    ],

    "Groceries": [
        "Monthly grocery purchase at Reliance Smart",
        "Bought vegetables from local market",
        "BigBasket monthly essentials order",
        "Blinkit household supplies payment",
        "Purchased rice dal and cooking oil",
        "Milk and bread purchase from grocery shop",
        "Zepto fruits and vegetables delivery",
        "DMart household grocery bill",
        "Kirana store monthly grocery payment",
        "Purchased eggs and fresh vegetables"
    ],

    "Healthcare": [
        "Apollo hospital doctor consultation",
        "Purchased medicines from Netmeds",
        "Blood test payment at diagnostic laboratory",
        "Paid dental clinic treatment bill",
        "Doctor prescription medicine purchase",
        "MRI scan payment at diagnostic centre",
        "Eye checkup consultation charges",
        "Purchased medicines from local pharmacy",
        "Physiotherapy treatment session payment",
        "Hospital emergency treatment bill"
    ],

    "Insurance": [
        "LIC life insurance premium paid online",
        "HDFC health insurance policy renewal",
        "Paid vehicle insurance installment",
        "Term life insurance premium transfer",
        "Two wheeler policy renewal payment",
        "Family medical insurance premium",
        "Car insurance payment through UPI",
        "Annual home insurance renewal",
        "Insurance policy premium debit",
        "Health cover installment payment"
    ],

    "Other": [
        "Unidentified merchant UPI transaction",
        "Miscellaneous household service payment",
        "Small unexpected personal expense",
        "General purpose payment to local vendor",
        "Unknown merchant debit card purchase",
        "One time miscellaneous service charge",
        "Personal donation payment",
        "Unclassified household expense",
        "General repair service payment",
        "Miscellaneous personal UPI transfer"
    ],

    "Personal Care": [
        "Haircut payment at local barber shop",
        "VLCC beauty treatment appointment",
        "Purchased face wash and skincare cream",
        "Salon hair styling service payment",
        "Spa massage appointment charges",
        "Purchased personal hygiene essentials",
        "Manicure service payment at beauty salon",
        "Bought grooming products from pharmacy",
        "Facial treatment at local salon",
        "Hair colouring service payment"
    ],

    "Rent": [
        "November apartment rent paid to landlord",
        "Monthly PG accommodation payment",
        "Flat rent transfer through UPI",
        "Residential house lease payment",
        "Monthly hostel room rent",
        "Paid landlord housing rent online",
        "Apartment rental payment for November",
        "Monthly paying guest accommodation charges",
        "House rent bank transfer",
        "Room rent payment to property owner"
    ],

    "Shopping": [
        "Bought Samsung smartphone from online store",
        "Amazon order for wireless headphones",
        "Purchased formal shirts from Myntra",
        "Flipkart laptop accessory purchase",
        "Bought new running shoes online",
        "Purchased office backpack from retail store",
        "Shopping mall clothing purchase",
        "Bought home furniture using debit card",
        "Purchased smartwatch from electronics shop",
        "Online order for household appliances"
    ],

    "Subscriptions": [
        "Netflix monthly plan auto renewal",
        "Spotify Premium monthly debit",
        "Amazon Prime annual membership renewal",
        "Google One cloud storage monthly charge",
        "Microsoft 365 annual license renewal",
        "Adobe Creative Cloud subscription payment",
    ],

    "Transportation": [
        "Uber auto ride payment",
        "Ola cab fare to railway station",
        "Kolkata Metro smart card recharge",
        "Petrol purchase at Indian Oil pump",
        "Rapido bike taxi fare",
        "Local bus ticket payment",
        "Car servicing bill payment",
        "Two wheeler puncture repair charges",
        "FASTag highway toll recharge",
        "Vehicle parking fee payment"
    ],

    "Travel": [
        "IndiGo flight ticket for holiday",
        "Hotel stay booking through MakeMyTrip",
        "Goibibo vacation hotel reservation",
        "Darjeeling holiday tour package payment",
        "Domestic flight booking for family trip",
        "Hotel accommodation during vacation",
        "Travel agency holiday package installment",
        "International holiday flight reservation",
        "Resort booking for weekend trip",
        "Vacation accommodation advance payment"
    ],

    "Utilities": [
        "WBSEDCL electricity bill payment",
        "CESC monthly power bill",
        "Airtel prepaid mobile recharge",
        "JioFiber broadband monthly payment",
        "Indane LPG cylinder booking payment",
        "Municipal water bill online payment",
        "Airtel postpaid mobile bill",
        "Tata Play DTH recharge",
        "BSNL broadband bill payment",
        "Electricity bill paid through PhonePe"
    ]
}


def expand_dataset():

    print("Loading cleaned dataset...")

    df = pd.read_csv(INPUT_PATH)

    # Check required columns
    required_columns = {"description", "category"}

    if not required_columns.issubset(df.columns):
        raise ValueError(
            "Dataset must contain description and category columns."
        )

    additions = []

    for category, descriptions in NEW_DATA.items():

        for description in descriptions:

            additions.append({
                "description": description,
                "category": category
            })

    new_df = pd.DataFrame(additions)

    # Normalize descriptions for duplicate checking
    df["description"] = df["description"].astype(str).str.strip()
    new_df["description"] = new_df["description"].str.strip()

    existing_descriptions = set(
        df["description"].str.lower()
    )

    new_df = new_df[
        ~new_df["description"].str.lower().isin(
            existing_descriptions
        )
    ].copy()

    # Also remove duplicates within the new examples
    new_df = new_df.drop_duplicates(
        subset=["description"],
        keep="first"
    )

    expanded_df = pd.concat(
        [df, new_df],
        ignore_index=True
    )

    # Save without overwriting original files
    expanded_df.to_csv(
        OUTPUT_PATH,
        index=False
    )

    print("\nDataset expansion completed!")
    print("Original records:", len(df))
    print("New records added:", len(new_df))
    print("Expanded records:", len(expanded_df))

    print("\nUpdated category distribution:")
    print(
        expanded_df["category"]
        .value_counts()
        .sort_index()
    )

    print("\nSaved to:", OUTPUT_PATH)


if __name__ == "__main__":
    expand_dataset()

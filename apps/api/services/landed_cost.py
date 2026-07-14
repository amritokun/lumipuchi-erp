from typing import List, Dict, Any

def calculate_po_landed_costs(
    items: List[Dict[str, Any]], # keys: unit_cost_foreign, quantity
    exchange_rate: float,
    china_domestic_shipping: float, # INR
    international_freight: float,   # INR
    customs_duty_percent: float,    # e.g., 20.0
    clearing_charges: float,        # INR
    insurance: float,               # INR
    other_charges: float            # INR
) -> Dict[str, Any]:
    """
    Calculate the landed cost per unit for each item in a Purchase Order.
    Allocates shared shipment costs (shipping, freight, clearing, insurance, etc.)
    proportionally based on the raw value of the items in INR.
    """
    total_raw_value_inr = 0.0
    processed_items = []

    # 1. Compute raw INR values
    for item in items:
        unit_raw_inr = item["unit_cost_foreign"] * exchange_rate
        total_line_raw_inr = unit_raw_inr * item["quantity"]
        total_raw_value_inr += total_line_raw_inr
        processed_items.append({
            **item,
            "unit_raw_inr": unit_raw_inr,
            "total_line_raw_inr": total_line_raw_inr
        })

    total_shared_expenses = (
        china_domestic_shipping +
        international_freight +
        clearing_charges +
        insurance +
        other_charges
    )

    total_landed_cost_inr = 0.0

    # 2. Allocate shared expenses & customs duty per line item
    for item in processed_items:
        # Avoid division by zero if total raw value is 0
        if total_raw_value_inr > 0:
            value_share_ratio = item["total_line_raw_inr"] / total_raw_value_inr
            allocated_shared_cost_line = value_share_ratio * total_shared_expenses
            allocated_shared_cost_unit = allocated_shared_cost_line / item["quantity"]
        else:
            allocated_shared_cost_unit = 0.0

        customs_duty_unit = item["unit_raw_inr"] * (customs_duty_percent / 100.0)
        landed_cost_unit = item["unit_raw_inr"] + customs_duty_unit + allocated_shared_cost_unit
        
        item["landed_cost_inr_per_unit"] = landed_cost_unit
        item["total_landed_cost_line"] = landed_cost_unit * item["quantity"]
        total_landed_cost_inr += item["total_landed_cost_line"]

    return {
        "items": processed_items,
        "total_raw_value_inr": total_raw_value_inr,
        "total_shared_expenses": total_shared_expenses,
        "total_landed_cost_inr": total_landed_cost_inr
    }

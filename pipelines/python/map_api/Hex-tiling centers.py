# Hex-tiling centers for Google Places NearbySearch coverage
# - Center: 37.501332, 127.039573 (Gangnam area)
# - Search radius (per query): r = 35 meters
# - We produce hexagonal grid of centers that "covers" a circular area (configurable).
# - Output: plotted grid + a DataFrame of center coordinates you can download as CSV.

import math
import pandas as pd
import matplotlib.pyplot as plt
from caas_jupyter_tools import display_dataframe_to_user

# -----------------------------
# Parameters (you can tweak)
# -----------------------------
center_lat = 37.501332
center_lng = 127.039573
r_m = 35.0                           # NearbySearch radius in meters
cover_radius_m = 500.0               # how far from center to cover (meters). Adjust to your needs.

# Hex grid geometry (pointy-top convention)
dx = math.sqrt(3) * r_m              # horizontal distance between adjacent centers
dy = 1.5 * r_m                        # vertical spacing between rows

# Earth scale factors near given latitude
def meters_per_degree_lat(lat_deg: float) -> float:
    # Approx: ~111_132 m/deg latitude (slight variation is negligible at city scale)
    return 111_132.0

def meters_per_degree_lng(lat_deg: float) -> float:
    # meters per degree longitude varies by latitude
    return 111_320.0 * math.cos(math.radians(lat_deg))

m_per_deg_lat = meters_per_degree_lat(center_lat)
m_per_deg_lng = meters_per_degree_lng(center_lat)

def offset_meters_to_latlng(center_lat, center_lng, dx_m, dy_m):
    dlat = dy_m / m_per_deg_lat
    dlng = dx_m / m_per_deg_lng
    return center_lat + dlat, center_lng + dlng

# -----------------------------
# Generate hex centers
# -----------------------------
centers = []

# Determine how many rows/cols needed to cover the circle of radius cover_radius_m
n_rows = int(math.ceil(cover_radius_m / dy)) + 2  # small buffer
n_cols = int(math.ceil(cover_radius_m / dx)) + 2

for row in range(-n_rows, n_rows + 1):
    # y offset (meters) from the origin row
    y = row * dy
    # horizontal offset for odd/even rows (pointy-top hex grid)
    x_offset = 0.5 * dx if (row % 2 != 0) else 0.0
    
    # for each row, sweep columns so that |x| <= cover_radius_m + dx
    for col in range(-n_cols, n_cols + 1):
        x = col * dx + x_offset
        
        # keep only points within circular cover area
        if math.hypot(x, y) <= cover_radius_m:
            lat, lng = offset_meters_to_latlng(center_lat, center_lng, x, y)
            centers.append({
                "row": row,
                "col": col,
                "offset_x_m": x,
                "offset_y_m": y,
                "lat": lat,
                "lng": lng
            })

df = pd.DataFrame(centers).reset_index(drop=True)

# -----------------------------
# Show a quick plot
# -----------------------------
plt.figure(figsize=(7,7))
plt.scatter(df["lng"], df["lat"], s=10, label="Hex centers")
plt.scatter([center_lng], [center_lat], s=60, marker="*", label="Origin (center)")
plt.gca().set_aspect("equal", adjustable="datalim")  # keep aspect ratio
plt.title(f"Hex centers for r={r_m} m, coverage≈{cover_radius_m} m (N={len(df)})")
plt.xlabel("Longitude")
plt.ylabel("Latitude")
plt.legend()
plt.show()

# Display the centers as a table the user can copy/export
display_dataframe_to_user("hex_centers_gangnam", df)

# Also save to CSV for download
csv_path = "/mnt/data/hex_centers_gangnam.csv"
df.to_csv(csv_path, index=False)
csv_path

export type MenuItem = {
  name: string
  price: number
}

export type Restaurant = {
  restaurant_id: number
  name: string
  address: string
  phone: string
  summary: string
  image: string[]
  category: string
  rating: number
  price_range: string
  website_url: string
  menu: MenuItem[]
  distance_m: number
  is_open: boolean
}

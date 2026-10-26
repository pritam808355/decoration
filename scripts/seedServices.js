const fs = require('fs');
const path = require('path');

const services = [
  // ==========================================
  // CATEGORY 1: BIRTHDAY PARTIES (10 Items)
  // ==========================================
  {
    id: "srv-bday-1",
    title: "Pastel Dream Birthday Ring Arch",
    category: "birthday",
    categoryLabel: "Birthday Parties",
    priceStart: 2499,
    rating: 4.9,
    reviewCount: 194,
    badge: "Bestseller",
    description: "Signature pastel pink, peach, lavender & white organic balloon ring arch with custom LED Happy Birthday neon sign and 2 cylindrical cake pedestals.",
    features: [
      "250+ High Grade Pastel Latex & Chrome Balloons",
      "Custom LED Neon 'Happy Birthday' Light Sign",
      "Round Golden Mesh Backdrop Ring (6.5 ft)",
      "2 Golden Confetti Foil Star Balloons",
      "Setup & Dismantle included (Within 2 hrs)"
    ],
    image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&auto=format&fit=crop&q=80",
    tags: ["Pastel", "Ring Arch", "Neon Sign", "Cake Pedestal"]
  },
  {
    id: "srv-bday-2",
    title: "Royal Black & Gold Adult Milestone Arch",
    category: "birthday",
    categoryLabel: "Birthday Parties",
    priceStart: 2999,
    rating: 5.0,
    reviewCount: 165,
    badge: "Luxury Signature",
    description: "Opulent metallic chrome gold, midnight black and white balloon garland arch with warm neon lighting and giant 3ft milestone number foils (18, 25, 30, 50).",
    features: [
      "300+ Chrome Gold & Metallic Jet Black Balloons",
      "Giant 3ft Milestone Age Number Balloons with LED lights",
      "Warm White LED Neon Signboard",
      "Round Heavy-Base Golden Ring Frame",
      "Floor balloon scatter & ribbon styling"
    ],
    image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80",
    tags: ["Black & Gold", "Milestone 30th", "Luxury Adult", "Chrome"]
  },
  {
    id: "srv-bday-3",
    title: "Pastel Rainbow Kids Wonderland Theme",
    category: "birthday",
    categoryLabel: "Birthday Parties",
    priceStart: 1999,
    rating: 4.8,
    reviewCount: 120,
    badge: "Kids Favorite",
    description: "Playful pastel rainbow balloon clouds with customizable cartoon cutouts (Jungle, Cocomelon, Peppa Pig, or Superhero) and age number foil.",
    features: [
      "200+ Pastel Pink, Sky Blue, Mint & Lemon Balloons",
      "Theme Character Sunboard Cutouts",
      "Rainbow Balloon Wave Arch",
      "Customized Birthday Banner easel stand",
      "100% Child-Safe Non-Toxic Materials"
    ],
    image: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800&auto=format&fit=crop&q=80",
    tags: ["Kids", "Rainbow", "Cartoon Theme", "1st Birthday"]
  },
  {
    id: "srv-bday-4",
    title: "Surprise Bedroom Balloon Canopy & Fairy Lights",
    category: "birthday",
    categoryLabel: "Birthday Parties",
    priceStart: 1499,
    rating: 4.9,
    reviewCount: 230,
    badge: "Budget Friendly",
    description: "Intimate bedroom surprise with 100 helium-look ceiling balloons with hanging photo memories, bed heart styling, and warm fairy lights.",
    features: [
      "100 Ceiling & Floor Metallic Balloons",
      "20 Hanging Memory Photo Clips with Ribbon Curls",
      "Warm White Fairy String Lights across room",
      "Golden 'Happy Birthday' Foil Letter Banner",
      "4 Heart / Star Metallic Foil Balloons"
    ],
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80",
    tags: ["Surprise", "Room Decor", "Fairy Lights", "Photo Clips", "Affordable"]
  },
  {
    id: "srv-bday-5",
    title: "Grand Jungle Safari 1st Birthday Setup",
    category: "birthday",
    categoryLabel: "Birthday Parties",
    priceStart: 3899,
    rating: 4.9,
    reviewCount: 88,
    badge: "Trending",
    description: "Lush botanical jungle theme with forest green, chrome gold & pastel balloons, life-size animal cutouts (Lion, Giraffe, Elephant), and wooden plinth.",
    features: [
      "350+ Olive Green, Sage & Metallic Gold Balloons",
      "4 Giant Lifelike Animal Sunboard Cutouts",
      "Artificial Palm Leaves, Vines & Pampas Grass",
      "Light-up Marquee Number '1' (3 feet)",
      "Personalized Welcome Milestone Acrylic Easel"
    ],
    image: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=800&auto=format&fit=crop&q=80",
    tags: ["Jungle Safari", "1st Birthday", "Animal Cutouts", "Green Gold"]
  },
  {
    id: "srv-bday-6",
    title: "Barbie Pink Glamour Birthday Theme",
    category: "birthday",
    categoryLabel: "Birthday Parties",
    priceStart: 3499,
    rating: 4.9,
    reviewCount: 95,
    badge: "Popular",
    description: "Hot pink, baby pink and shimmer silver balloon wall with lifesize Barbie doll box photobooth prop and neon girl power sign.",
    features: [
      "Life-size Walk-in Barbie Box Photo Prop",
      "300+ Hot Pink, Pastel Pink & White Balloons",
      "Silver Shimmer Sequin Wall Backdrop",
      "Neon 'Happy Birthday' / Custom Name light",
      "Glitter star foil accents & balloon garland"
    ],
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80",
    tags: ["Barbie", "Pink Glamour", "Shimmer Wall", "Photobooth"]
  },
  {
    id: "srv-bday-7",
    title: "Terrace Sunset Candlelight & Balloon Arch",
    category: "birthday",
    categoryLabel: "Birthday Parties",
    priceStart: 2799,
    rating: 4.8,
    reviewCount: 74,
    badge: "Romantic Pick",
    description: "Open-air rooftop birthday setup with fairy light curtain, pastel balloon half-arch, candle pathway, and cozy low-seating floor decor.",
    features: [
      "Rooftop Fairy Light Curtain (10x8 ft)",
      "Half-Arch Pastel Balloon Garland",
      "Battery-operated LED Candles & Rose Petals",
      "Happy Birthday LED Neon Sign",
      "Floor cushions & aesthetic rug styling"
    ],
    image: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800&auto=format&fit=crop&q=80",
    tags: ["Terrace", "Candlelight", "Open Air", "Fairy Light"]
  },
  {
    id: "srv-bday-8",
    title: "Superhero Action Spiderman & Avengers Setup",
    category: "birthday",
    categoryLabel: "Birthday Parties",
    priceStart: 2299,
    rating: 4.8,
    reviewCount: 65,
    badge: "Action Packed",
    description: "High-energy red, royal blue, and black balloon garland with 3D Spiderman / Iron Man cutouts, web props, and city skyline backdrop.",
    features: [
      "220+ Metallic Red, Royal Blue & Chrome Balloons",
      "Superhero Character Standees & Shield Foils",
      "City Skyline Backdrop Curtain",
      "Spiderweb balloon art & hanging foil stars",
      "Age number foil balloon with pedestal"
    ],
    image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&auto=format&fit=crop&q=80",
    tags: ["Superhero", "Avengers", "Spiderman", "Boys Birthday"]
  },
  {
    id: "srv-bday-9",
    title: "Rose Gold & Champagne Milestone Jubilee",
    category: "birthday",
    categoryLabel: "Birthday Parties",
    priceStart: 3199,
    rating: 4.9,
    reviewCount: 82,
    badge: "Elegant",
    description: "Sophisticated rose gold, blush pink and champagne organic balloon garland draped over an acrylic arch with fairy lighting.",
    features: [
      "280+ Premium Rose Gold & Champagne Balloons",
      "Semi-Circular Acrylic Arch with Custom Vinyl Lettering",
      "Warm White Neon 'Celebration' Sign",
      "2 Rose Gold Mirror Pedestals",
      "Floor balloon bunches & balloon cascade"
    ],
    image: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&auto=format&fit=crop&q=80",
    tags: ["Rose Gold", "Champagne", "Milestone", "Acrylic Arch"]
  },
  {
    id: "srv-bday-10",
    title: "Space & Galaxy Astronaut Theme Setup",
    category: "birthday",
    categoryLabel: "Birthday Parties",
    priceStart: 2699,
    rating: 4.9,
    reviewCount: 57,
    badge: "Unique",
    description: "Explore the stars with midnight blue, chrome silver and deep purple balloons, astronaut & rocket cutouts, and planet foil balloons.",
    features: [
      "Midnight Blue, Chrome Silver & Purple Balloon Clusters",
      "Inflatable / Sunboard Astronaut & Rocket Props",
      "Saturn & Star foil orb balloons",
      "LED Starry projection or fairy lights",
      "Custom Astronaut Theme Birthday Banner"
    ],
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80",
    tags: ["Space", "Galaxy", "Astronaut", "Silver Blue"]
  },

  // ==========================================
  // CATEGORY 2: WEDDINGS & ENGAGEMENTS (10 Items)
  // ==========================================
  {
    id: "srv-wed-1",
    title: "Royal Double Ring Wedding & Engagement Arch",
    category: "wedding",
    categoryLabel: "Weddings",
    priceStart: 5499,
    rating: 4.9,
    reviewCount: 142,
    badge: "Signature",
    description: "Grand double circle 7.5ft golden ring arch with white pearl, champagne chrome balloons, eucalyptus florals, and illuminated acrylic couple name board.",
    features: [
      "Double Circle 7.5ft Golden Metal Ring Arch",
      "Champagne Gold, Ivory White & Pearl Chrome Balloons",
      "Fresh/Artificial Floral Accents, Eucalyptus & Pampas",
      "Illuminated Couple Name Board & Fairy Lights",
      "2 Golden Ring Ceremony Cake / Pedestal Stands"
    ],
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80",
    tags: ["Wedding Stage", "Double Ring", "Champagne Gold", "Florals"]
  },
  {
    id: "srv-wed-2",
    title: "Vibrant Haldi & Mehendi Yellow Marigold Setup",
    category: "wedding",
    categoryLabel: "Weddings",
    priceStart: 3499,
    rating: 4.9,
    reviewCount: 110,
    badge: "Trending",
    description: "Radiant marigold yellow, orange and lime green balloon garland backdrop with traditional brass urlis, floral tassels, and Haldi neon sign.",
    features: [
      "Yellow & Chrome Gold Balloon Garland Backdrop",
      "Artificial Marigold Flower Malas & Tassels",
      "Wooden/Brass Urli decoration backdrop props",
      "Custom Haldi / Mehendi Neon Sign",
      "Floor cushions & backdrop drape styling"
    ],
    image: "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?w=800&auto=format&fit=crop&q=80",
    tags: ["Haldi", "Mehendi", "Marigold", "Yellow Theme"]
  },
  {
    id: "srv-wed-3",
    title: "Luxury Bridal Car Decoration with Heart Balloons",
    category: "wedding",
    categoryLabel: "Weddings",
    priceStart: 1899,
    rating: 4.8,
    reviewCount: 85,
    badge: "Essential",
    description: "Elegant bridal getaway car decoration with satin ribbons, pastel heart foil balloons, bonnet floral bouquets, and door handle bows.",
    features: [
      "Bonnet Luxury Floral & Balloon Cluster Bouquet",
      "Heart-shaped foil balloons on rear & roof",
      "Satin ribbon bonnet trails & door handle bows",
      "'Just Married' / Couple Initials window art",
      "Damage-free suction clamps for paint protection"
    ],
    image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&auto=format&fit=crop&q=80",
    tags: ["Car Decor", "Bridal Car", "Just Married", "Ribbon Bouquet"]
  },
  {
    id: "srv-wed-4",
    title: "Grand Wedding Stage Floral Balloon Backdrop",
    category: "wedding",
    categoryLabel: "Weddings",
    priceStart: 8999,
    rating: 5.0,
    reviewCount: 68,
    badge: "Ultra Luxury",
    description: "Magnificent 16x10ft stage backdrop with cascading white and champagne balloons, fresh white lilies and roses, warm spot uplights, and luxury sofa setup.",
    features: [
      "16x10ft Grand Fabric & Balloon Cascading Backdrop",
      "Premium Imported Chrome & Latex Balloons (500+)",
      "Fresh Rose & Lily Floral runners",
      "4 LED Focus Uplights for stage illumination",
      "On-site wedding stylist supervision"
    ],
    image: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&auto=format&fit=crop&q=80",
    tags: ["Stage Backdrop", "Stage Decor", "White Lilies", "Royal Wedding"]
  },
  {
    id: "srv-wed-5",
    title: "Romantic Marry Me Proposal Canopy",
    category: "wedding",
    categoryLabel: "Weddings",
    priceStart: 4299,
    rating: 5.0,
    reviewCount: 138,
    badge: "Unforgettable",
    description: "Light up the question of a lifetime with illuminated 3ft 'MARRY ME' giant LED letter blocks, red rose petal carpet, and romantic heart balloon arch.",
    features: [
      "3ft Giant Illuminated 'M-A-R-R-Y M-E' LED Letters",
      "Red & Rose Gold Heart Balloon Arch",
      "Red Rose Petals 20ft Pathway with Candles",
      "Fairy Light Backdrop Canopy",
      "Champagne bucket table styling"
    ],
    image: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=800&auto=format&fit=crop&q=80",
    tags: ["Proposal", "Marry Me", "LED Letters", "Rose Petals"]
  },
  {
    id: "srv-wed-6",
    title: "Sangeet & Cocktail Night Neon Party Backdrop",
    category: "wedding",
    categoryLabel: "Weddings",
    priceStart: 4799,
    rating: 4.8,
    reviewCount: 52,
    badge: "Party Mood",
    description: "High-glam disco vibe with black, silver chrome & electric blue balloons, disco mirror balls, and glowing neon bar/stage sign.",
    features: [
      "Silver Mirror Disco Balls hanging clusters",
      "Chrome Silver, Deep Navy & Black Balloon Wave",
      "Custom Neon Sign: 'Better Together' or 'Let's Dance'",
      "Stage lighting & sparkle effects",
      "Cocktail bar balloon pillar accents"
    ],
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80",
    tags: ["Sangeet", "Cocktail", "Disco Balls", "Mirror Shine"]
  },
  {
    id: "srv-wed-7",
    title: "Boho Chic Engagement Pampas & Balloon Arch",
    category: "wedding",
    categoryLabel: "Weddings",
    priceStart: 4199,
    rating: 4.9,
    reviewCount: 64,
    badge: "Boho Aesthetic",
    description: "Earthy nude, blush, terracotta and ivory organic balloon installation with natural dry pampas grass, palm spears, and wooden arch frame.",
    features: [
      "Hexagon or Triangle Natural Wooden Arch",
      "Nude, Terracotta, Peach & Ivory Balloons",
      "Natural Dried Fluffy Pampas Grass Plumes",
      "Customized Couple Name Acrylic Board",
      "Rattan/Jute floor mats & macrame props"
    ],
    image: "https://images.unsplash.com/photo-1519225429980-715cb0215aed?w=800&auto=format&fit=crop&q=80",
    tags: ["Boho", "Pampas Grass", "Terracotta", "Engagement"]
  },
  {
    id: "srv-wed-8",
    title: "Wedding Entrance Floral Balloon Walkway Tunnel",
    category: "wedding",
    categoryLabel: "Weddings",
    priceStart: 6999,
    rating: 4.9,
    reviewCount: 43,
    badge: "Grand Entry",
    description: "Dazzling 20-foot illuminated walkway with repeating white balloon arches, hanging floral garlands, and red carpet for bridal entry.",
    features: [
      "3 Interlinked White Pearl & Gold Balloon Arches",
      "20ft Red or White Velvet Carpet Runner",
      "Hanging Wisteria & Jasmine floral trails",
      "6 Golden Pathway Pedestal Pillars with Lanterns",
      "Fairy light string canopy along tunnel"
    ],
    image: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=800&auto=format&fit=crop&q=80",
    tags: ["Entrance Tunnel", "Bridal Walkway", "Red Carpet", "Lanterns"]
  },
  {
    id: "srv-wed-9",
    title: "Traditional Floral Mandap Balloon Framing",
    category: "wedding",
    categoryLabel: "Weddings",
    priceStart: 7499,
    rating: 4.8,
    reviewCount: 39,
    badge: "Sacred Ceremonies",
    description: "Traditional 4-pillar mandap enhancement with subtle golden and maroon balloon clusters intertwined with fresh rajnigandha and marigold garlands.",
    features: [
      "4-Pillar Mandap Top & Base Balloon Framing",
      "Fresh Rajnigandha & Red Rose Floral Garlands",
      "Traditional Brass Diya Urli props",
      "Warm Halogen spotlights on mandap",
      "Drape fabric coordination"
    ],
    image: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&auto=format&fit=crop&q=80",
    tags: ["Mandap", "Traditional", "Marigold", "Rajnigandha"]
  },
  {
    id: "srv-wed-10",
    title: "Bachelor / Bachelorette Party Balloon Room",
    category: "wedding",
    categoryLabel: "Weddings",
    priceStart: 2599,
    rating: 4.9,
    reviewCount: 91,
    badge: "Fun & Trendy",
    description: "Celebrate the last fling before the ring with 'Bride to Be' foil letters, champagne bottle balloon pop, pink & rose gold ceiling balloons, and photo props.",
    features: [
      "Giant Champagne Bottle Foil Balloon with balloon bubbles",
      "'BRIDE TO BE' / 'GROOM SQUAD' Foil Banner",
      "100 Metallic Pink, Gold & Rose Chrome Balloons",
      "Sash & Tiara photo prop kit",
      "Fairy lights and ring-shaped foil balloon"
    ],
    image: "https://images.unsplash.com/photo-1529636798458-92182e662485?w=800&auto=format&fit=crop&q=80",
    tags: ["Bachelorette", "Bride to Be", "Champagne Pop", "Girls Night"]
  },

  // ==========================================
  // CATEGORY 3: BABY SHOWER & NAMING (10 Items)
  // ==========================================
  {
    id: "srv-baby-1",
    title: "Pastel Clouds Baby Shower & Teddy Setup",
    category: "babyshower",
    categoryLabel: "Baby Shower",
    priceStart: 3299,
    rating: 5.0,
    reviewCount: 154,
    badge: "Mom's Favorite",
    description: "Enchanting pastel pink, mint blue and lavender balloon clouds with 4ft giant plush teddy bear, light-up 'B-A-B-Y' letter boxes, and illuminated Mom-to-Be neon sign.",
    features: [
      "Organic Balloon Wave Arch (Pastel Blue, Pink & Gold)",
      "4ft Adorable Cuddly Teddy Bear Centerpiece",
      "Light-up 'B-A-B-Y' Acrylic Transparent Letter Boxes",
      "Neon 'Mom to Be' / 'Baby Shower' LED sign",
      "Welcome Stand with Baby Name / Message"
    ],
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80",
    tags: ["Baby Shower", "Teddy Bear", "Mom to Be", "Pastel Clouds"]
  },
  {
    id: "srv-baby-2",
    title: "Welcome Baby Home Coming Door & Cradle Decor",
    category: "babyshower",
    categoryLabel: "Baby Shower",
    priceStart: 2199,
    rating: 4.9,
    reviewCount: 115,
    badge: "Heartwarming",
    description: "Warm welcome for mom and newborn home coming with entrance door arch, delicate cradle floral garland, cute baby footprint foils, and Welcome banner.",
    features: [
      "Entrance Main Door Balloon Arch or Gateway",
      "Baby Cradle / Bassinet Balloon & Floral Garland",
      "Giant Baby Milk Bottle & Stork Foil Balloons",
      "'Welcome Prince / Princess' Gold Banner",
      "50 ceiling balloons with hanging ribbons"
    ],
    image: "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800&auto=format&fit=crop&q=80",
    tags: ["Welcome Baby", "Home Coming", "Cradle", "Newborn"]
  },
  {
    id: "srv-baby-3",
    title: "Grand Naming Ceremony (Naamkaran) Ring Arch",
    category: "babyshower",
    categoryLabel: "Baby Shower",
    priceStart: 3599,
    rating: 4.9,
    reviewCount: 88,
    badge: "Traditional",
    description: "Sacred naming ceremony backdrop with golden ring frame, yellow, peach and white pastel balloons, hanging flower malas, and acrylic board for baby's name reveal.",
    features: [
      "6.5ft Golden Ring Arch with Floral Balloons",
      "Acrylic Board with Baby Name in Gold Foil Lettering",
      "Fresh Marigold / Mogra Flower Accents",
      "Traditional Brass Cradle Decoration",
      "2 Golden Pedestal Cake / Diya stands"
    ],
    image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80",
    tags: ["Naming Ceremony", "Naamkaran", "Name Reveal", "Ring Arch"]
  },
  {
    id: "srv-baby-4",
    title: "Hot Air Balloon Baby Shower Photobooth",
    category: "babyshower",
    categoryLabel: "Baby Shower",
    priceStart: 3999,
    rating: 4.9,
    reviewCount: 67,
    badge: "Creative",
    description: "Magical 3D Hot Air Balloon basket where mom-to-be can sit for photos, surrounded by cloud balloons, glowing stars, and 'Oh Baby' neon sign.",
    features: [
      "Sit-in Wicker Hot Air Balloon Basket Photo Prop",
      "Giant Balloon Hot Air Sphere with Netting",
      "Floor Balloon Clouds (Pastel Blue & White)",
      "Illuminated 'Oh Baby' Neon Sign",
      "Hanging 3D Stars & Moon Foils"
    ],
    image: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800&auto=format&fit=crop&q=80",
    tags: ["Hot Air Balloon", "Oh Baby", "Photobooth", "Wicker Basket"]
  },
  {
    id: "srv-baby-5",
    title: "Gender Reveal Balloon Pop & Cloud Box",
    category: "babyshower",
    categoryLabel: "Baby Shower",
    priceStart: 2799,
    rating: 5.0,
    reviewCount: 92,
    badge: "Exciting Moment",
    description: "Build the suspense with half-pink half-blue balloon ring arch, giant 36-inch mystery black balloon with confetti pop, and smoke effect.",
    features: [
      "36-inch Giant Black Mystery Pop Balloon with Pink/Blue Confetti",
      "Half Pink & Half Blue Arch Backdrop",
      "'He or She? What Will Baby Be?' Wooden Easel Board",
      "Gender Reveal Confetti Cannons (2 pcs)",
      "Pin to pop & safety equipment"
    ],
    image: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800&auto=format&fit=crop&q=80",
    tags: ["Gender Reveal", "Confetti Pop", "He or She", "Boy or Girl"]
  },
  {
    id: "srv-baby-6",
    title: "Little Prince Royal Blue & Gold Baby Shower",
    category: "babyshower",
    categoryLabel: "Baby Shower",
    priceStart: 2999,
    rating: 4.8,
    reviewCount: 54,
    badge: "Royal Boy",
    description: "Regal celebration for your baby boy with royal navy blue, chrome gold and white balloons, gold crown foil centerpieces, and 'Prince' signage.",
    features: [
      "Royal Blue, Chrome Gold & Pearl White Balloon Garland",
      "Giant Golden Crown Foil Balloons (2 pcs)",
      "'Welcome Little Prince' Backdrop Sign",
      "Gold Cake Plinth with Royal Cushion",
      "Floor balloon cascade and star foils"
    ],
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80",
    tags: ["Little Prince", "Royal Blue", "Crown", "Baby Boy"]
  },
  {
    id: "srv-baby-7",
    title: "Little Princess Pink & Rose Gold Shower",
    category: "babyshower",
    categoryLabel: "Baby Shower",
    priceStart: 2999,
    rating: 4.8,
    reviewCount: 61,
    badge: "Sweet Princess",
    description: "Pretty in pink celebration with blush pink, rose gold, white balloons, butterfly foil cutouts, pearl garlands, and delicate fairy lighting.",
    features: [
      "Blush Pink, Rose Gold & White Organic Balloon Arch",
      "3D Golden Flying Butterflies accents",
      "'A Little Princess is on the Way' Acrylic Sign",
      "Pink Tulle Fabric Backdrop Drapes",
      "White cylindrical dessert pedestal"
    ],
    image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&auto=format&fit=crop&q=80",
    tags: ["Princess", "Pink Rose Gold", "Butterflies", "Baby Girl"]
  },
  {
    id: "srv-baby-8",
    title: "Woodland Forest Cute Animals Baby Shower",
    category: "babyshower",
    categoryLabel: "Baby Shower",
    priceStart: 3699,
    rating: 4.9,
    reviewCount: 48,
    badge: "Nature Theme",
    description: "Cozy woodland atmosphere with sage green, beige and chocolate balloons, friendly forest animal cutouts (Deer, Fox, Owl), and wooden tree trunk plinths.",
    features: [
      "Sage Green, Cream & Warm Tan Balloon Garland",
      "Cute Baby Deer, Fox & Bunny Standee Cutouts",
      "Natural Wood Slice Dessert Stands",
      "Artificial Ivy Greenery & Ferns",
      "'Welcome to the World' Banner"
    ],
    image: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=800&auto=format&fit=crop&q=80",
    tags: ["Woodland", "Forest Animals", "Sage Green", "Earth Tones"]
  },
  {
    id: "srv-baby-9",
    title: "Twinkle Twinkle Little Star Baby Shower",
    category: "babyshower",
    categoryLabel: "Baby Shower",
    priceStart: 2899,
    rating: 4.9,
    reviewCount: 79,
    badge: "Dreamy",
    description: "White, champagne and soft yellow balloon clouds with giant crescent moon foil, hanging fairy star lights, and dreamy cloud floor puffs.",
    features: [
      "3ft Giant Gold Crescent Moon Foil Balloon",
      "Hanging LED Warm White Fairy Star Curtain",
      "Fluffy Balloon Floor Clouds with Star Accents",
      "'Twinkle Twinkle Little Star' Script Sign",
      "Gentle warm atmosphere for photoshoot"
    ],
    image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80",
    tags: ["Twinkle Star", "Moon & Stars", "Dreamy", "Yellow Gold"]
  },
  {
    id: "srv-baby-10",
    title: "Baby Annaprashan (First Rice Eating) Ceremony",
    category: "babyshower",
    categoryLabel: "Baby Shower",
    priceStart: 3199,
    rating: 4.8,
    reviewCount: 42,
    badge: "Milestone",
    description: "Celebrate baby's first solid food milestone with auspicious marigold and pastel balloon arch, traditional brass thali decor, and silver cradle styling.",
    features: [
      "Pastel Yellow, White & Orange Balloon Garland",
      "Silver / Brass Dining Thali Table Setup",
      "Fresh Marigold Flower Garland Backdrop",
      "'Baby's Annaprashan' Welcome Sunboard",
      "Traditional rangoli & floor design"
    ],
    image: "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?w=800&auto=format&fit=crop&q=80",
    tags: ["Annaprashan", "Rice Eating", "Traditional", "First Meal"]
  },

  // ==========================================
  // CATEGORY 4: CORPORATE EVENTS (10 Items)
  // ==========================================
  {
    id: "srv-corp-1",
    title: "Grand Welcome Corporate Stage & Gateway",
    category: "corporate",
    categoryLabel: "Corporate Events",
    priceStart: 4999,
    rating: 4.8,
    reviewCount: 78,
    badge: "Corporate Choice",
    description: "Professional 12-14ft balloon gateway and stage backdrop with customized 'WELCOME' acrylic sign, brand color matching pillars, and red carpet entrance styling.",
    features: [
      "12-14ft Grand Balloon Entrance Gateway Arch",
      "Stage Backdrop with Customized 'WELCOME' Sign",
      "Exact Corporate Brand Color matching (Up to 4 colors)",
      "2 Heavy-Base Welcome Balloon Columns/Pillars",
      "Red Carpet Welcome Runner (optional add-on)"
    ],
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80",
    tags: ["Corporate", "Welcome Gateway", "Annual Gala", "Showroom Opening"]
  },
  {
    id: "srv-corp-2",
    title: "Showroom & Retail Store Grand Opening Gateway",
    category: "corporate",
    categoryLabel: "Corporate Events",
    priceStart: 3799,
    rating: 4.9,
    reviewCount: 112,
    badge: "High Footfall",
    description: "Eye-catching dual-color spiral balloon arch covering the entire storefront, with 2 majestic entrance columns and red ribbon cutting setup.",
    features: [
      "Full Storefront Width Spiral Balloon Arch",
      "2 Heavy Pillars with Custom Logo Foil Balloons",
      "Scissors & Red Ribbon Cutting Velvet Tray",
      "Weather-resistant heavy-duty outdoor balloons",
      "Setup done by 7:30 AM before store opening"
    ],
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80",
    tags: ["Grand Opening", "Store Launch", "Ribbon Cutting", "Spiral Arch"]
  },
  {
    id: "srv-corp-3",
    title: "Annual Day Gala Award Ceremony Stage",
    category: "corporate",
    categoryLabel: "Corporate Events",
    priceStart: 7999,
    rating: 5.0,
    reviewCount: 54,
    badge: "Executive",
    description: "Prestige stage framing with metallic gold and obsidian black balloon arches, LED uplighting, podium decoration, and trophy table styling.",
    features: [
      "16ft Stage Backdrop Balloon Architecture",
      "Executive Metallic Gold & Chrome Black Theme",
      "Podium & Speaker Stage Floral Balloon Framing",
      "Award Trophy Table Styling with Gold Runner",
      "GST Invoice & Corporate Payment Support"
    ],
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80",
    tags: ["Annual Gala", "Award Ceremony", "Executive", "Podium"]
  },
  {
    id: "srv-corp-4",
    title: "Office Festive Diwali / New Year Celebration",
    category: "corporate",
    categoryLabel: "Corporate Events",
    priceStart: 4299,
    rating: 4.8,
    reviewCount: 68,
    badge: "Festive Vibes",
    description: "Transform your office bays and cafeteria with festive golden yellow and orange balloon garlands, paper lanterns, and entrance arch.",
    features: [
      "Cafeteria & Reception Balloon Ceiling Clusters (150 pcs)",
      "Main Entry Arch with Festive Ribbon Trails",
      "Bay divider balloon flowers & fairy lights",
      "Festive 'Happy Diwali / New Year' Banner",
      "Quick non-disruptive setup after office hours"
    ],
    image: "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?w=800&auto=format&fit=crop&q=80",
    tags: ["Office Party", "Diwali", "New Year", "Cafeteria"]
  },
  {
    id: "srv-corp-5",
    title: "Product Launch & Brand Reveal Backdrop",
    category: "corporate",
    categoryLabel: "Corporate Events",
    priceStart: 6499,
    rating: 4.9,
    reviewCount: 45,
    badge: "Media Ready",
    description: "Camera-ready media wall with step-and-repeat logo branding framed with corporate brand color organic balloons and spotlight illumination.",
    features: [
      "10x8ft Step & Repeat Media Photo Backdrop",
      "Organic Balloon Wave framing the top and left side",
      "2 LED Studio Spotlights for crisp photography",
      "Product display pedestal with acrylic riser",
      "High sheen balloon shine protection spray"
    ],
    image: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&auto=format&fit=crop&q=80",
    tags: ["Product Launch", "Media Wall", "Photobooth", "Press Release"]
  },
  {
    id: "srv-corp-6",
    title: "Corporate Milestone 5th / 10th / 25th Anniversary",
    category: "corporate",
    categoryLabel: "Corporate Events",
    priceStart: 5499,
    rating: 4.9,
    reviewCount: 38,
    badge: "Milestone",
    description: "Commemorate company milestones with giant 4ft metallic year number foils, grand reception balloon arch, and employee photo selfie frame.",
    features: [
      "4ft Giant Milestone Foil Numbers (e.g., '10 YEARS')",
      "Reception Area Grand Gateway Arch",
      "Customized Selfie Photobooth Frame with Company Hashtag",
      "Desk balloon clusters for top performers",
      "Corporate brand color customization"
    ],
    image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80",
    tags: ["Company Anniversary", "10 Years", "Milestone", "Hashtag Frame"]
  },
  {
    id: "srv-corp-7",
    title: "Exhibition & Trade Fair Booth Balloon Branding",
    category: "corporate",
    categoryLabel: "Corporate Events",
    priceStart: 3999,
    rating: 4.8,
    reviewCount: 41,
    badge: "High Visibility",
    description: "Stand out in crowded trade expos with high-rising balloon pillar towers, overhead booth truss balloon framing, and promotional giveaway foil balloons.",
    features: [
      "2 High-Visibility 10ft Balloon Column Towers",
      "Overhead Booth Truss Border Garland",
      "50 Helium Logo Foil Balloons for visitor giveaways",
      "Compact space-saving layout for 3x3m expo stalls",
      "Next morning dismantle service included"
    ],
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80",
    tags: ["Exhibition", "Expo Stall", "Trade Fair", "Pillars"]
  },
  {
    id: "srv-corp-8",
    title: "Employee Appreciation & Farewell Party Decor",
    category: "corporate",
    categoryLabel: "Corporate Events",
    priceStart: 2499,
    rating: 4.9,
    reviewCount: 57,
    badge: "Team Spirit",
    description: "Celebrate retirement, farewell, or employee of the year with classy conference room ceiling balloons, 'Best Wishes' foil banner, and photobooth.",
    features: [
      "Conference Room Ceiling Helium-look Balloons (80 pcs)",
      "'Best Wishes / Thank You' Golden Foil Banner",
      "Photo Backdrop Curtain with fairy string lights",
      "Desk bouquet balloon cluster with personalized card",
      "Quick 45-minute setup"
    ],
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80",
    tags: ["Farewell", "Employee Appreciation", "Conference Room", "Thank You"]
  },
  {
    id: "srv-corp-9",
    title: "Startup Funding & Success Party Setup",
    category: "corporate",
    categoryLabel: "Corporate Events",
    priceStart: 4599,
    rating: 5.0,
    reviewCount: 34,
    badge: "High Energy",
    description: "Celebrate Series A/B funding, unicorn milestone, or major launch with green & gold wealth theme, giant dollar / rupee foil balloon, and champagne wall.",
    features: [
      "Emerald Green, Chrome Gold & White Balloon Arch",
      "Giant Currency / Unicorn Symbol Foil Centerpiece",
      "Champagne Glass Holding Acrylic Wall Backdrop",
      "Neon 'TO THE MOON' / Custom Slogan Sign",
      "Music sync stage balloon pillars"
    ],
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80",
    tags: ["Startup", "Funding", "Success Party", "Champagne Wall"]
  },
  {
    id: "srv-corp-10",
    title: "Corporate Sports Day & Marathon Arch",
    category: "corporate",
    categoryLabel: "Corporate Events",
    priceStart: 3899,
    rating: 4.8,
    reviewCount: 29,
    badge: "Outdoor",
    description: "Heavy-duty outdoor start & finish line balloon arch for annual corporate sports events, runathons, and outdoor team building activities.",
    features: [
      "14ft High Wind-Resistant Start/Finish Line Arch",
      "Bright High-Contrast Tri-Color Balloon Spiral",
      "Heavy Concrete Weighted Bases for stability",
      "Finish line celebration banner mounting",
      "All-weather durability guaranteed"
    ],
    image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=80",
    tags: ["Sports Day", "Marathon", "Start Line", "Outdoor Arch"]
  },

  // ==========================================
  // CATEGORY 5: ANNIVERSARIES & WELCOME (10 Items)
  // ==========================================
  {
    id: "srv-anniv-1",
    title: "Romantic Heart & Ring Anniversary Arch",
    category: "anniversary",
    categoryLabel: "Anniversaries",
    priceStart: 2999,
    rating: 4.9,
    reviewCount: 145,
    badge: "Romantic",
    description: "Celebrate years of love with a stunning pink and rose gold balloon arch, illuminated 'Happy Anniversary' neon sign, warm fairy lights, and red rose flower accents.",
    features: [
      "Rose Gold, Blush Pink & White Balloon Ring Arch",
      "Illuminated 'Happy Anniversary' Script Neon Sign",
      "Warm White LED String Fairy Lights & Candle Pathway",
      "Milestone Year Foil Balloons (e.g. 1st, 10th, 25th)",
      "Rose petals & bedside or floor styling"
    ],
    image: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&auto=format&fit=crop&q=80",
    tags: ["Anniversary", "Heart Arch", "Romantic", "Neon Sign"]
  },
  {
    id: "srv-anniv-2",
    title: "Silver Jubilee 25th Anniversary Grand Setup",
    category: "anniversary",
    categoryLabel: "Anniversaries",
    priceStart: 4999,
    rating: 5.0,
    reviewCount: 112,
    badge: "25th Jubilee",
    description: "Honoring 25 years of togetherness with metallic silver chrome, pearl white, and crystal clear balloons, giant silver '25' marquee, and couple photos memory wall.",
    features: [
      "Metallic Silver Chrome & Pearl White Organic Arch",
      "3ft Light-up Marquee Number '25'",
      "Illuminated '25 Years of Togetherness' Acrylic Board",
      "Memory Photo Hanging Wall with fairy lights",
      "2 Silver Pedestals with Floral Vases"
    ],
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80",
    tags: ["Silver Jubilee", "25th Anniversary", "Silver Chrome", "Marquee"]
  },
  {
    id: "srv-anniv-3",
    title: "Golden Jubilee 50th Anniversary Royal Arch",
    category: "anniversary",
    categoryLabel: "Anniversaries",
    priceStart: 5499,
    rating: 5.0,
    reviewCount: 89,
    badge: "50th Jubilee",
    description: "A monumental milestone deserves royalty: metallic gold, champagne and warm ivory arch, giant '50' golden numbers, and comfortable royal couple chairs.",
    features: [
      "Double Ring Metallic Gold & Champagne Arch",
      "Giant 3ft '50' Golden Milestone Foil Balloons",
      "Warm LED Spotlight & Fairy Light Backdrop",
      "Custom Golden Jubilee Blessing Board",
      "Rose petal pathway leading to stage"
    ],
    image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80",
    tags: ["Golden Jubilee", "50th Anniversary", "Gold Theme", "Milestone"]
  },
  {
    id: "srv-anniv-4",
    title: "Romantic Bedroom Surprise with Red Heart Balloons",
    category: "anniversary",
    categoryLabel: "Anniversaries",
    priceStart: 1799,
    rating: 4.9,
    reviewCount: 198,
    badge: "Bestseller",
    description: "Surprise your partner with 100 deep red and metallic gold ceiling balloons, bed rose heart arrangement, scented tea-light candles, and hanging photo memories.",
    features: [
      "100 Ceiling & Floor Balloons with Curling Ribbons",
      "Heart Shape Rose Petal Styling on Bed",
      "20 Photo Memory Clips with String Lights",
      "'Happy Anniversary' Golden Foil Letter Banner",
      "4 Red Heart Foil Balloons"
    ],
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80",
    tags: ["Bedroom Surprise", "Red Hearts", "Rose Petals", "Candles"]
  },
  {
    id: "srv-anniv-5",
    title: "1st Paper Anniversary Pastel Love Nest",
    category: "anniversary",
    categoryLabel: "Anniversaries",
    priceStart: 2499,
    rating: 4.8,
    reviewCount: 84,
    badge: "1st Anniversary",
    description: "Sweet and romantic 1st anniversary celebration with pastel peach, blush pink, and white balloons, illuminated '1' marquee, and personalized love message board.",
    features: [
      "Pastel Pink & Peach Balloon Half-Arch",
      "Light-up Marquee Number '1'",
      "'365 Days of Love' Custom Love Poster",
      "Fairy lights across curtain backdrop",
      "2 Heart foil balloons on cake table"
    ],
    image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&auto=format&fit=crop&q=80",
    tags: ["1st Anniversary", "365 Days", "Peach Pink", "Love Nest"]
  },
  {
    id: "srv-anniv-6",
    title: "Candlelight Dinner & Cabana Tent Balloon Setup",
    category: "anniversary",
    categoryLabel: "Anniversaries",
    priceStart: 3899,
    rating: 4.9,
    reviewCount: 76,
    badge: "Cabana Tent",
    description: "Cozy private white chiffon cabana tent on terrace or room with balloon garland, warm fairy light canopy, and romantic dining table setup.",
    features: [
      "White Chiffon Fabric Cabana / Canopy Tent",
      "Pastel & Chrome Balloon Garland around entrance",
      "LED Fairy Light Curtain wrapped around tent poles",
      "Dining table styling with candle holders & flowers",
      "Floor rugs and plush velvet cushions"
    ],
    image: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800&auto=format&fit=crop&q=80",
    tags: ["Cabana Tent", "Candlelight Dinner", "Terrace", "Romantic"]
  },
  {
    id: "srv-anniv-7",
    title: "Parents Anniversary Special Grand Reunion",
    category: "anniversary",
    categoryLabel: "Anniversaries",
    priceStart: 3499,
    rating: 4.9,
    reviewCount: 92,
    badge: "Family Favorite",
    description: "Express your gratitude for mom and dad's enduring love with royal gold and maroon ring arch, family photo timeline, and cake reveal pedestals.",
    features: [
      "Gold & Maroon Ring Arch Backdrop",
      "Family Photo Timeline Tree with 25-30 vintage photos",
      "'Happy Anniversary Mom & Dad' Custom Neon Sign",
      "2 Gold Cake & Gift Plinths",
      "Blessing guestbook table styling"
    ],
    image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&auto=format&fit=crop&q=80",
    tags: ["Mom and Dad", "Family Photo Tree", "Maroon Gold", "Parents"]
  },
  {
    id: "srv-anniv-8",
    title: "Poolside Romantic Balloon & Lantern Island",
    category: "anniversary",
    categoryLabel: "Anniversaries",
    priceStart: 4599,
    rating: 4.8,
    reviewCount: 39,
    badge: "Luxury Outdoor",
    description: "Enchanting poolside evening setup with floating water balloons, candle lanterns along perimeter, and balloon ring arch with water reflections.",
    features: [
      "Floating Water Balloon Clusters & Floating Candles",
      "Poolside Golden Ring Arch with Floral Accents",
      "20 Glass Lanterns with Warm Candles along edge",
      "Illuminated Neon Sign reflected on water",
      "Cocktail high table decoration"
    ],
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80",
    tags: ["Poolside", "Water Balloons", "Lanterns", "Evening Glow"]
  },
  {
    id: "srv-anniv-9",
    title: "Car Trunk Surprise Romantic Anniversary Decor",
    category: "anniversary",
    categoryLabel: "Anniversaries",
    priceStart: 1899,
    rating: 4.9,
    reviewCount: 143,
    badge: "Viral Trend",
    description: "Pop the car boot to reveal a breathtaking surprise of pastel & heart balloons, fairy light string, memory photos, and personalized letter banner.",
    features: [
      "Car Boot / Trunk Full Balloon Garland Styling",
      "Battery-Powered Warm Fairy String Lights",
      "Hanging Polaroid Photo Memory Cards",
      "'Happy Anniversary / I Love You' Foil Banner",
      "Small Cake Stand & Rose Petal Bed"
    ],
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80",
    tags: ["Car Boot", "Car Trunk", "Surprise", "Driveway"]
  },
  {
    id: "srv-anniv-10",
    title: "10th Tin / Diamond Milestone Glamour Arch",
    category: "anniversary",
    categoryLabel: "Anniversaries",
    priceStart: 3299,
    rating: 4.8,
    reviewCount: 65,
    badge: "10 Years",
    description: "A decade of love celebrated with metallic chrome blue, silver and white balloons, illuminated '10' marquee, and elegant ring backdrop.",
    features: [
      "Chrome Navy, Silver & White Balloon Arch",
      "Illuminated '10' Milestone Marquee Numbers",
      "'A Decade of Love' Custom Acrylic Board",
      "Silver foil balloon stars & accents",
      "Cake pedestal with silver sequin runner"
    ],
    image: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&auto=format&fit=crop&q=80",
    tags: ["10th Anniversary", "Decade", "Silver Blue", "Chrome"]
  },

  // ==========================================
  // CATEGORY 6: OTHER OCCASIONS & THEMES (10 Items)
  // ==========================================
  {
    id: "srv-other-1",
    title: "Let's Celebrate Custom Theme & Milestone",
    category: "other",
    categoryLabel: "Other Occasions",
    priceStart: 2199,
    rating: 4.8,
    reviewCount: 96,
    badge: "Bespoke",
    description: "Custom balloon styling for housewarmings, naming ceremonies, bachelorette parties, graduation celebrations, and festive gatherings tailored to your color theme.",
    features: [
      "Custom Organic Balloon Garland or Arch",
      "'Let's Celebrate' or Custom Name Foil Banner",
      "Foil Star & Confetti Balloons",
      "Choice of 3 Pastel or Metallic Shades",
      "On-site styling and quick 90-minute setup"
    ],
    image: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800&auto=format&fit=crop&q=80",
    tags: ["Custom Celebration", "Bachelorette", "Housewarming", "Graduation"]
  },
  {
    id: "srv-other-2",
    title: "Griha Pravesh (Housewarming) Auspicious Gateway",
    category: "other",
    categoryLabel: "Other Occasions",
    priceStart: 2599,
    rating: 4.9,
    reviewCount: 134,
    badge: "Auspicious",
    description: "Bless your new home with auspicious marigold orange, golden yellow, and mango green balloon toran, entrance pillars, and Kalash props.",
    features: [
      "Main Entrance Toran & Door Frame Balloon Garland",
      "2 Welcome Columns with Swastik / Shubh Labh foils",
      "Artificial Mango Leaves & Marigold Malas",
      "'Shubh Griha Pravesh' Welcome Board",
      "Living room ceiling balloon scatter"
    ],
    image: "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?w=800&auto=format&fit=crop&q=80",
    tags: ["Housewarming", "Griha Pravesh", "Toran", "New Home"]
  },
  {
    id: "srv-other-3",
    title: "Graduation & Convocation Success Party Decor",
    category: "other",
    categoryLabel: "Other Occasions",
    priceStart: 2399,
    rating: 4.8,
    reviewCount: 68,
    badge: "Achievement",
    description: "Celebrate earning that degree with black, gold and white balloon arch, graduation cap foil balloons, diploma props, and 'Class of 2026' banner.",
    features: [
      "Metallic Black, Gold & White Balloon Garland",
      "Giant Graduation Cap & Scroll Foil Balloons",
      "'CONGRATS GRAD' / 'CLASS OF 2026' Letter Banner",
      "Photo booth frame with graduation props",
      "Fairy lights and golden confetti balloons"
    ],
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80",
    tags: ["Graduation", "Convocation", "Degree", "Congrats Grad"]
  },
  {
    id: "srv-other-4",
    title: "Retirement & Golden Years Celebration Setup",
    category: "other",
    categoryLabel: "Other Occasions",
    priceStart: 2799,
    rating: 4.9,
    reviewCount: 59,
    badge: "Milestone",
    description: "Honor a lifetime of hard work with dignified gold and navy balloon arch, 'Happy Retirement' illuminated backdrop, and career memory photo board.",
    features: [
      "Royal Navy & Chrome Gold Balloon Ring Arch",
      "'Happy Retirement' Script Foil Banner",
      "Photo collage board showcasing career journey",
      "2 Golden Pedestal stands for cake & gifts",
      "Warm LED lighting for photos"
    ],
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80",
    tags: ["Retirement", "Golden Years", "Navy Gold", "Career Salute"]
  },
  {
    id: "srv-other-5",
    title: "Kitty Party & High Tea Pastel Floral Theme",
    category: "other",
    categoryLabel: "Other Occasions",
    priceStart: 2299,
    rating: 4.8,
    reviewCount: 77,
    badge: "Ladies Day Out",
    description: "Chic pastel pink, mint and gold balloon installation with floral teacup props, table runners, and Instagram-worthy selfie backdrop.",
    features: [
      "Pastel Wave Balloon Backdrop with Fairy Lights",
      "Floral Centerpieces for Dining / Coffee Tables",
      "Vintage Teacup & Floral Prop Kit",
      "Customized 'Queens Gathering' Selfie Frame",
      "Floor balloon scatter in coordinated shades"
    ],
    image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&auto=format&fit=crop&q=80",
    tags: ["Kitty Party", "High Tea", "Ladies Day", "Selfie Backdrop"]
  },
  {
    id: "srv-other-6",
    title: "Festive Christmas & New Year Balloon Wonderland",
    category: "other",
    categoryLabel: "Other Occasions",
    priceStart: 3299,
    rating: 5.0,
    reviewCount: 104,
    badge: "Holiday Magic",
    description: "Holiday celebration with evergreen emerald, candy cane red and snow white balloons, giant candy cane foils, Christmas tree arch, and snow puffs.",
    features: [
      "Candy Cane Red, Emerald Green & Snow White Arch",
      "Giant Inflatable / Foil Candy Canes & Santa Stars",
      "Snow-look balloon floor puffs & white fairy lights",
      "'Merry Christmas & Happy New Year' Sign",
      "Holiday photo booth props"
    ],
    image: "https://images.unsplash.com/photo-1512474932049-78ac69eed10c?w=800&auto=format&fit=crop&q=80",
    tags: ["Christmas", "New Year", "Candy Cane", "Holiday Season"]
  },
  {
    id: "srv-other-7",
    title: "Valentine's Day Romantic Love Room & Corridor",
    category: "other",
    categoryLabel: "Other Occasions",
    priceStart: 2699,
    rating: 4.9,
    reviewCount: 165,
    badge: "Valentine Special",
    description: "Ultimate Valentine surprise with 150 red, pink and rose gold balloons, giant 'LOVE' cursive foil, rose petal walkway, and heart ceiling balloons.",
    features: [
      "150 Red, Rose Gold & Pink Metallic Balloons",
      "Giant Connected Cursive 'LOVE' Foil Balloon",
      "Rose Petals Carpet Pathway with Scented Candles",
      "Heart shape floor and bed arrangement",
      "Fairy lights across room walls"
    ],
    image: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&auto=format&fit=crop&q=80",
    tags: ["Valentine", "Love Room", "Red Hearts", "February 14"]
  },
  {
    id: "srv-other-8",
    title: "Kids Theme Slumber Party & Teepee Tent Setup",
    category: "other",
    categoryLabel: "Other Occasions",
    priceStart: 4299,
    rating: 4.9,
    reviewCount: 46,
    badge: "Sleepover Fun",
    description: "Magical sleepover party with 3 cozy wooden teepee tents, individual mattresses, pastel balloon garland overhead, and fairy fairy lights.",
    features: [
      "3 Wooden A-Frame Teepee Tents with Fabric Covers",
      "3 Single Mattresses with Cozy Bedding & Cushions",
      "Pastel Balloon Garland draped across tent frames",
      "Fairy lights & individual tray tables with lanterns",
      "Personalized chalkboard name signs for kids"
    ],
    image: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800&auto=format&fit=crop&q=80",
    tags: ["Slumber Party", "Teepee Tent", "Sleepover", "Kids Fun"]
  },
  {
    id: "srv-other-9",
    title: "Carnival & Circus Birthday Theme with Popcorn Prop",
    category: "other",
    categoryLabel: "Other Occasions",
    priceStart: 3899,
    rating: 4.8,
    reviewCount: 39,
    badge: "Colorful",
    description: "Step right up to a vibrant red, yellow and royal blue carnival balloon arch, popcorn box props, ticket standee, and festive bunting flags.",
    features: [
      "Red & Yellow Striped Circus Tent Balloon Arch",
      "Giant Popcorn Box & Ticket Sunboard Cutouts",
      "Colorful Bunting Flags & Carnival Pennants",
      "2 Carnival Game / Candy Pedestal Stands",
      "Child-safe non-toxic balloons"
    ],
    image: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800&auto=format&fit=crop&q=80",
    tags: ["Carnival", "Circus", "Popcorn", "Vibrant"]
  },
  {
    id: "srv-other-10",
    title: "Neon Glow-in-the-Dark Ultra Party Night",
    category: "other",
    categoryLabel: "Other Occasions",
    priceStart: 3499,
    rating: 4.9,
    reviewCount: 81,
    badge: "Night Party",
    description: "Turn off the lights and watch it glow! Blacklight fluorescent neon balloons, glow sticks, UV reactive paint backdrop, and neon sign.",
    features: [
      "250+ UV Reactive Fluorescent Glow Balloons",
      "2 UV Blacklight Floodlights for intense glow effect",
      "Neon LED Script Party Sign",
      "50 Glow Sticks and Neon Glasses for guests",
      "Dark room / banquet party setup"
    ],
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80",
    tags: ["Neon Glow", "UV Party", "Blacklight", "Nightclub"]
  }
];

const dest = path.join(__dirname, '..', 'data', 'services.json');
fs.writeFileSync(dest, JSON.stringify(services, null, 2));
console.log(`Successfully generated ${services.length} services across 6 categories!`);

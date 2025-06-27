import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const demoProducts = [
  {
    name: "Premium Almonds",
    price: 850,
    description: "Handpicked premium quality almonds, rich in protein and healthy fats. Perfect for snacking or adding to your favorite recipes.",
    imageUrl: "https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400&h=300&fit=crop"
  },
  {
    name: "Organic Walnuts",
    price: 750,
    description: "Fresh organic walnuts packed with omega-3 fatty acids and antioxidants. Great for brain health and heart wellness.",
    imageUrl: "https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=400&h=300&fit=crop"
  },
  {
    name: "Golden Raisins",
    price: 320,
    description: "Sweet and juicy golden raisins, naturally dried and preserved. Perfect for baking, cooking, or as a healthy snack.",
    imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop"
  },
  {
    name: "Premium Cashews",
    price: 920,
    description: "Premium grade cashews, creamy and delicious. Rich in minerals and perfect for making nut butter or enjoying as a snack.",
    imageUrl: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&h=300&fit=crop"
  },
  {
    name: "Dried Apricots",
    price: 450,
    description: "Naturally sweet dried apricots, rich in fiber and vitamin A. Great for digestive health and maintaining good vision.",
    imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop"
  },
  {
    name: "Pistachios",
    price: 680,
    description: "Fresh and crunchy pistachios, packed with protein and healthy fats. Perfect for snacking or adding to salads.",
    imageUrl: "https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400&h=300&fit=crop"
  },
  {
    name: "Dried Cranberries",
    price: 380,
    description: "Tart and sweet dried cranberries, rich in antioxidants and vitamin C. Great for urinary tract health.",
    imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop"
  },
  {
    name: "Premium Dates",
    price: 420,
    description: "Sweet and nutritious dates, natural energy boosters. Rich in fiber and perfect for natural sweetening.",
    imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop"
  },
  {
    name: "Mixed Nuts",
    price: 780,
    description: "Premium blend of almonds, walnuts, cashews, and pistachios. Perfect variety pack for healthy snacking.",
    imageUrl: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&h=300&fit=crop"
  }
];

const demoReviews = [
  {
    rating: 5,
    title: "Excellent Quality Almonds!",
    comment: "These almonds are absolutely fantastic! They're fresh, crunchy, and have a wonderful natural taste. Perfect for snacking or adding to my morning oatmeal. The packaging is also great and keeps them fresh for a long time.",
    pros: "Fresh, crunchy, great taste, good packaging",
    cons: "A bit expensive but worth it",
    purchaseType: "online",
    usageDuration: "one_to_three_months",
    userName: "Sarah Johnson",
    userAvatar: "https://ui-avatars.com/api/?name=Sarah+Johnson&background=2E7D32&color=fff"
  },
  {
    rating: 4,
    title: "Good Quality Walnuts",
    comment: "The walnuts are fresh and have a nice rich flavor. They're perfect for baking and snacking. The organic certification gives me peace of mind about the quality.",
    pros: "Fresh, organic, good for baking",
    cons: "Some pieces are smaller than expected",
    purchaseType: "online",
    usageDuration: "less_than_month",
    userName: "Michael Chen",
    userAvatar: "https://ui-avatars.com/api/?name=Michael+Chen&background=2E7D32&color=fff"
  },
  {
    rating: 5,
    title: "Amazing Golden Raisins!",
    comment: "These golden raisins are so sweet and juicy! They're perfect for my baking projects and also great as a healthy snack. Much better than the regular dark raisins I used to buy.",
    pros: "Sweet, juicy, perfect for baking",
    cons: "None really",
    purchaseType: "store",
    usageDuration: "three_to_six_months",
    userName: "Emily Rodriguez",
    userAvatar: "https://ui-avatars.com/api/?name=Emily+Rodriguez&background=2E7D32&color=fff"
  },
  {
    rating: 4,
    title: "Premium Cashews Worth the Price",
    comment: "These cashews are definitely premium quality. They're creamy and have a rich flavor. Perfect for making cashew butter or enjoying as a snack. The price is high but the quality justifies it.",
    pros: "Creamy texture, rich flavor, premium quality",
    cons: "Expensive",
    purchaseType: "online",
    usageDuration: "more_than_six_months",
    userName: "David Thompson",
    userAvatar: "https://ui-avatars.com/api/?name=David+Thompson&background=2E7D32&color=fff"
  },
  {
    rating: 5,
    title: "Delicious Dried Apricots",
    comment: "These apricots are naturally sweet and have a wonderful chewy texture. They're perfect for snacking and also great in my morning smoothies. I love that they're rich in fiber and vitamin A.",
    pros: "Naturally sweet, chewy texture, nutritious",
    cons: "Can be sticky sometimes",
    purchaseType: "gift",
    usageDuration: "one_to_three_months",
    userName: "Lisa Wang",
    userAvatar: "https://ui-avatars.com/api/?name=Lisa+Wang&background=2E7D32&color=fff"
  },
  {
    rating: 4,
    title: "Fresh and Crunchy Pistachios",
    comment: "The pistachios are fresh and have a nice crunch. They're perfect for snacking and also great in salads. The shells are easy to crack and the nuts inside are plump and flavorful.",
    pros: "Fresh, crunchy, easy to shell",
    cons: "Some shells are hard to crack",
    purchaseType: "online",
    usageDuration: "less_than_month",
    userName: "Robert Kim",
    userAvatar: "https://ui-avatars.com/api/?name=Robert+Kim&background=2E7D32&color=fff"
  },
  {
    rating: 3,
    title: "Decent Cranberries",
    comment: "The cranberries are tart and sweet as expected. They're good for baking and adding to cereals. However, I found them to be a bit too tart for snacking directly.",
    pros: "Good for baking, tart flavor",
    cons: "Too tart for direct snacking",
    purchaseType: "store",
    usageDuration: "three_to_six_months",
    userName: "Jennifer Lee",
    userAvatar: "https://ui-avatars.com/api/?name=Jennifer+Lee&background=2E7D32&color=fff"
  },
  {
    rating: 5,
    title: "Perfect Natural Sweetener",
    comment: "These dates are amazing! They're naturally sweet and perfect for replacing sugar in my recipes. They're also great for energy before workouts. The texture is soft and chewy, exactly what I was looking for.",
    pros: "Natural sweetener, energy boost, soft texture",
    cons: "Can be messy to handle",
    purchaseType: "online",
    usageDuration: "more_than_six_months",
    userName: "Alex Martinez",
    userAvatar: "https://ui-avatars.com/api/?name=Alex+Martinez&background=2E7D32&color=fff"
  },
  {
    rating: 5,
    title: "Great Variety Pack",
    comment: "This mixed nuts pack is perfect! It has a great variety of nuts and they're all fresh and delicious. Perfect for snacking and also great for adding to my trail mix. The packaging keeps them fresh for a long time.",
    pros: "Great variety, fresh, good packaging",
    cons: "Wish there were more cashews",
    purchaseType: "online",
    usageDuration: "one_to_three_months",
    userName: "Maria Garcia",
    userAvatar: "https://ui-avatars.com/api/?name=Maria+Garcia&background=2E7D32&color=fff"
  }
];

export const populateDemoData = async () => {
  try {
    console.log('Starting to populate demo data...');
    
    for (const product of demoProducts) {
      await addDoc(collection(db, 'products'), {
        ...product,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`Added: ${product.name}`);
    }
    
    console.log('Demo data populated successfully!');
    return true;
  } catch (error) {
    console.error('Error populating demo data:', error);
    return false;
  }
};

// Function to populate demo reviews
export const populateDemoReviews = async () => {
  try {
    console.log('Starting to populate demo reviews...');
    
    // Get all products first
    const productsSnapshot = await getDocs(collection(db, 'products'));
    const products = productsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    if (products.length === 0) {
      console.log('No products found. Please populate products first.');
      return false;
    }
    
    // Add reviews for each product
    for (const product of products) {
      // Add 2-4 reviews per product
      const numReviews = Math.floor(Math.random() * 3) + 2;
      
      for (let i = 0; i < numReviews; i++) {
        const review = demoReviews[Math.floor(Math.random() * demoReviews.length)];
        const reviewData = {
          ...review,
          productId: product.id,
          productName: product.name,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
          updatedAt: new Date(),
          userId: `demo-user-${Math.floor(Math.random() * 1000)}`,
          verified: Math.random() > 0.3, // 70% verified purchases
          helpful: Math.floor(Math.random() * 20),
          reported: false
        };
        
        await addDoc(collection(db, 'reviews'), reviewData);
        console.log(`Added review for: ${product.name}`);
      }
    }
    
    console.log('Demo reviews populated successfully!');
    return true;
  } catch (error) {
    console.error('Error populating demo reviews:', error);
    return false;
  }
};

// Function to check if demo data already exists
export const checkDemoData = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'products'));
    return querySnapshot.size > 0;
  } catch (error) {
    console.error('Error checking demo data:', error);
    return false;
  }
};

// Function to check if demo reviews already exist
export const checkDemoReviews = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'reviews'));
    return querySnapshot.size > 0;
  } catch (error) {
    console.error('Error checking demo reviews:', error);
    return false;
  }
}; 
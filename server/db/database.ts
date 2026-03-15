import Database from "better-sqlite3";
import bcrypt from "bcryptjs";

export const db = new Database("realestate.db");

// Initialize Database Schema
export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT DEFAULT 'admin'
    );

    CREATE TABLE IF NOT EXISTS developers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      logo TEXT,
      description TEXT,
      website TEXT
    );

    CREATE TABLE IF NOT EXISTS destinations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      image TEXT,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      location TEXT,
      price_range TEXT,
      type TEXT,
      status TEXT,
      description TEXT,
      main_image TEXT,
      gallery TEXT,
      amenities TEXT,
      developer_id INTEGER,
      destination_id INTEGER,
      is_featured INTEGER DEFAULT 0,
      beds TEXT,
      size TEXT,
      slug TEXT UNIQUE,
      meta_title TEXT,
      meta_description TEXT,
      FOREIGN KEY (developer_id) REFERENCES developers(id),
      FOREIGN KEY (destination_id) REFERENCES destinations(id)
    );

    CREATE TABLE IF NOT EXISTS blogs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT,
      image TEXT,
      category TEXT,
      author TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      slug TEXT UNIQUE,
      meta_title TEXT,
      meta_description TEXT
    );

    CREATE TABLE IF NOT EXISTS careers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      location TEXT,
      type TEXT,
      description TEXT,
      requirements TEXT
    );

    CREATE TABLE IF NOT EXISTS property_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      message TEXT,
      project_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS amenities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS project_amenities (
      project_id INTEGER,
      amenity_id INTEGER,
      PRIMARY KEY (project_id, amenity_id),
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (amenity_id) REFERENCES amenities(id)
    );
  `);

  // Add SEO columns to existing tables (migration for backward compatibility)
  const addProjectColumn = (col: string) => {
    try {
      db.exec(`ALTER TABLE projects ADD COLUMN ${col}`);
    } catch (e) {
      // ignore if column exists
    }
  };
  addProjectColumn('meta_title TEXT');
  addProjectColumn('meta_description TEXT');

  const addBlogColumn = (col: string) => {
    try {
      db.exec(`ALTER TABLE blogs ADD COLUMN ${col}`);
    } catch (e) {
      // ignore if column exists
    }
  };
  addBlogColumn('meta_title TEXT');
  addBlogColumn('meta_description TEXT');

  seedData();
}

// Seed Database
function seedData() {
  // Seed property types
  const propertyTypeCount = db.prepare("SELECT COUNT(*) as count FROM property_types").get().count;
  if (propertyTypeCount === 0) {
    const propertyTypes = ['Apartment', 'Villa', 'Penthouse', 'Townhouse', 'Studio', 'Duplex'];
    propertyTypes.forEach(type => {
      db.prepare("INSERT OR IGNORE INTO property_types (name) VALUES (?)").run(type);
    });
  }

  // Seed amenities
  const amenityCount = db.prepare("SELECT COUNT(*) as count FROM amenities").get().count;
  if (amenityCount === 0) {
    const amenities = ['Pool', 'Gym', 'Parking', 'Security', 'Garden', 'Clubhouse', 'Kids Area'];
    amenities.forEach(amenity => {
      db.prepare("INSERT OR IGNORE INTO amenities (name) VALUES (?)").run(amenity);
    });
  }

  // Seed admin user
  const adminExists = db.prepare("SELECT * FROM users WHERE username = ?").get("admin");
  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync("admin123", 10);
    db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run("admin", hashedPassword);
  }

  // Seed initial projects, developers, and destinations
  const projectCount = db.prepare("SELECT COUNT(*) as count FROM projects").get().count;
  if (projectCount === 0) {
    const developers = [
      {
        name: "Mountain View",
        logo: "https://mountainviewegypt.com/wp-content/uploads/2021/06/Mountain-View-Logo.png",
        description: "Mountain View is a leading Egyptian real estate developer known for its unique architectural styles and vibrant communities."
      },
      {
        name: "SODIC",
        logo: "https://sodic.com/wp-content/themes/sodic/assets/images/logo.png",
        description: "SODIC is one of Egypt's leading real estate development companies, with a track record of delivering high-quality projects."
      },
      {
        name: "Palm Hills",
        logo: "https://www.palmhillsdevelopments.com/assets/images/logo.png",
        description: "Palm Hills Developments is a leading real estate company in the Egyptian market, primarily developing integrated residential, commercial real estate and resort projects."
      },
      {
        name: "Emaar Misr",
        logo: "https://emaarmisr.com/wp-content/uploads/2021/05/emaar-misr-logo.png",
        description: "Emaar Misr is the Egyptian arm of the global developer Emaar, bringing world-class standards to Egypt's most prestigious locations."
      }
    ];

    const devIds = developers.map(dev =>
      db.prepare("INSERT INTO developers (name, logo, description) VALUES (?, ?, ?)").run(dev.name, dev.logo, dev.description).lastInsertRowid
    );

    const destinations = [
      {
        name: "New Capital",
        image: "https://images.unsplash.com/photo-1541339907198-e08756edd811?auto=format&fit=crop&q=80&w=800",
        description: "The New Administrative Capital is Egypt's future hub, featuring modern infrastructure, smart city features, and the iconic Iconic Tower."
      },
      {
        name: "North Coast",
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800",
        description: "Egypt's Mediterranean paradise, known for its crystal-clear waters, white sandy beaches, and luxury summer resorts."
      },
      {
        name: "El Gouna",
        image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=800",
        description: "A self-sufficient, fully integrated resort town on the Red Sea coast, offering a unique lifestyle and world-class amenities."
      },
      {
        name: "New Cairo",
        image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800",
        description: "A prestigious residential and commercial district in Eastern Cairo, home to the American University in Cairo and luxury compounds."
      },
      {
        name: "Sheikh Zayed",
        image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800",
        description: "A high-end residential city in Western Cairo, known for its green spaces, luxury malls, and quiet atmosphere."
      },
      {
        name: "Soma Bay",
        image: "https://images.unsplash.com/photo-1506929197327-fb87b5d5ba05?auto=format&fit=crop&q=80&w=800",
        description: "An exclusive Red Sea destination featuring luxury hotels, golf courses, and world-renowned diving spots."
      }
    ];

    const destIds = destinations.map(dest =>
      db.prepare("INSERT INTO destinations (name, image, description) VALUES (?, ?, ?)").run(dest.name, dest.image, dest.description).lastInsertRowid
    );

    const projects = [
      {
        name: "Mountain View iCity",
        location: "New Cairo",
        price_range: "EGP 5M - EGP 25M",
        type: "Apartment",
        status: "Under Construction",
        description: "iCity is a revolutionary concept in New Cairo, offering a unique living experience with its 4D design and extensive green spaces.",
        main_image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800",
        gallery: [
          "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800",
          "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&q=80&w=800"
        ],
        amenities: ["Central Park", "Clubhouse", "Smart Home", "Security"],
        developer_id: devIds[0],
        destination_id: destIds[3],
        is_featured: 1,
        beds: "1-4 Beds",
        size: "100 - 450 sqm"
      },
      {
        name: "Marassi",
        location: "North Coast",
        price_range: "EGP 15M - EGP 150M",
        type: "Villa",
        status: "Completed",
        description: "Marassi is the North Coast's premier destination, offering a Mediterranean lifestyle with world-class golf courses and a vibrant marina.",
        main_image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800",
        gallery: [
          "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=800",
          "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&q=80&w=800"
        ],
        amenities: ["Beach Access", "Marina", "Golf Course", "Luxury Spa"],
        developer_id: devIds[3],
        destination_id: destIds[1],
        is_featured: 1,
        beds: "3-6 Beds",
        size: "250 - 1,200 sqm"
      },
      {
        name: "SODIC East",
        location: "New Capital",
        price_range: "EGP 8M - EGP 40M",
        type: "Townhouse",
        status: "Off-Plan",
        description: "SODIC East is a modern integrated community in the New Capital, designed for those who seek a balanced and healthy lifestyle.",
        main_image: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&q=80&w=800",
        gallery: [
          "https://images.unsplash.com/photo-1503387762-592dee58c460?auto=format&fit=crop&q=80&w=800",
          "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80&w=800"
        ],
        amenities: ["Sports Club", "Retail Area", "Parks", "Schools"],
        developer_id: devIds[1],
        destination_id: destIds[0],
        is_featured: 0,
        beds: "2-5 Beds",
        size: "180 - 600 sqm"
      }
    ];

    projects.forEach(p => {
      const metaTitle = `${p.name} - Luxury ${p.type} in ${p.location}`;
      const metaDescription = p.description.substring(0, 160) || `Discover ${p.name}, a premium ${p.type.toLowerCase()} property in ${p.location}.`;
      
      db.prepare(`
        INSERT INTO projects (name, location, price_range, type, status, description, main_image, gallery, amenities, developer_id, destination_id, is_featured, beds, size, meta_title, meta_description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        p.name, p.location, p.price_range, p.type, p.status, p.description, p.main_image,
        JSON.stringify(p.gallery), JSON.stringify(p.amenities), p.developer_id, p.destination_id, p.is_featured, p.beds, p.size, metaTitle, metaDescription
      );
    });

    const blogMetaTitle = "Investing in the New Administrative Capital - Real Estate Guide";
    const blogMetaDescription = "Learn about the investment potential of Egypt's New Administrative Capital and why it's a prime real estate opportunity.";
    
    db.prepare("INSERT INTO blogs (title, content, image, category, author, meta_title, meta_description) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
      "Investing in the New Administrative Capital",
      "The New Capital is set to become the heart of Egypt's economy, making it a prime spot for real estate investment...",
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=800",
      "Investment",
      "Ahmed Mansour",
      blogMetaTitle,
      blogMetaDescription
    );

    db.prepare("INSERT INTO careers (title, location, type, description, requirements) VALUES (?, ?, ?, ?, ?)").run(
      "Luxury Property Consultant",
      "New Cairo, Egypt",
      "Full-time",
      "Join our elite sales team and help clients find their dream homes in Egypt's most prestigious compounds.",
      "3+ years experience in the Egyptian real estate market, fluent in English and Arabic."
    );
  }
}


#!/usr/bin/env node
/**
 * Demo Setup Script
 * Creates sample files for THANOS demonstration
 */

const fs = require('fs');
const path = require('path');
const { faker } = require('@faker-js/faker');

class DemoSetup {
  constructor() {
    this.demoDir = path.join(__dirname, '..', 'demo-files');
    this.fileCount = 30;
  }

  async createDemoFiles() {
    console.log('🎬 Setting up THANOS demo files...');
    
    // Create demo directory
    if (!fs.existsSync(this.demoDir)) {
      fs.mkdirSync(this.demoDir, { recursive: true });
    }

    // Create various file types
    await this.createPhotos();
    await this.createDocuments();
    await this.createVideos();
    await this.createAudioFiles();
    await this.createMiscFiles();

    console.log(`✅ Created ${this.fileCount} demo files in ${this.demoDir}`);
    console.log('🚀 Ready for THANOS organization demo!');
  }

  async createPhotos() {
    const photosDir = path.join(this.demoDir, 'unorganized');
    if (!fs.existsSync(photosDir)) {
      fs.mkdirSync(photosDir, { recursive: true });
    }

    // Create mock photo files with metadata
    const photoFiles = [
      'IMG_001.jpg', 'IMG_002.jpg', 'vacation_sunset.jpg',
      'family_dinner.jpg', 'screenshot_2023.png', 'birthday_cake.jpg',
      'wedding_ceremony.jpg', 'nature_hike.jpg', 'city_skyline.jpg',
      'pet_photo.jpg'
    ];

    for (const filename of photoFiles) {
      const filePath = path.join(photosDir, filename);
      const mockContent = this.generateMockImageData(filename);
      fs.writeFileSync(filePath, mockContent);
    }

    console.log('📸 Created photo files');
  }

  async createDocuments() {
    const docsDir = path.join(this.demoDir, 'unorganized');
    
    const documentFiles = [
      { name: 'resume_2023.pdf', content: this.generateResumeContent() },
      { name: 'invoice_12345.pdf', content: this.generateInvoiceContent() },
      { name: 'contract_agreement.pdf', content: this.generateContractContent() },
      { name: 'meeting_notes.docx', content: this.generateMeetingNotes() },
      { name: 'project_report.pdf', content: this.generateReportContent() },
      { name: 'recipe_collection.txt', content: this.generateRecipeContent() },
      { name: 'travel_itinerary.pdf', content: this.generateTravelContent() }
    ];

    for (const doc of documentFiles) {
      const filePath = path.join(docsDir, doc.name);
      fs.writeFileSync(filePath, doc.content);
    }

    console.log('📄 Created document files');
  }

  async createVideos() {
    const videosDir = path.join(this.demoDir, 'unorganized');

    const videoFiles = [
      'birthday_party.mp4', 'vacation_clips.mov', 'presentation_recording.mp4',
      'funny_pet_video.mp4', 'wedding_highlights.mov'
    ];

    for (const filename of videoFiles) {
      const filePath = path.join(videosDir, filename);
      const mockContent = this.generateMockVideoData(filename);
      fs.writeFileSync(filePath, mockContent);
    }

    console.log('🎥 Created video files');
  }

  async createAudioFiles() {
    const audioDir = path.join(this.demoDir, 'unorganized');

    const audioFiles = [
      'voice_memo_001.mp3', 'favorite_song.mp3', 'podcast_episode.mp3',
      'meeting_recording.wav', 'music_demo.mp3'
    ];

    for (const filename of audioFiles) {
      const filePath = path.join(audioDir, filename);
      const mockContent = this.generateMockAudioData(filename);
      fs.writeFileSync(filePath, mockContent);
    }

    console.log('🎵 Created audio files');
  }

  async createMiscFiles() {
    const miscDir = path.join(this.demoDir, 'unorganized');

    const miscFiles = [
      { name: 'data_backup.zip', content: 'Mock ZIP archive content' },
      { name: 'spreadsheet_data.xlsx', content: this.generateSpreadsheetContent() },
      { name: 'presentation_slides.pptx', content: this.generatePresentationContent() }
    ];

    for (const file of miscFiles) {
      const filePath = path.join(miscDir, file.name);
      fs.writeFileSync(filePath, file.content);
    }

    console.log('📦 Created miscellaneous files');
  }

  generateMockImageData(filename) {
    // Create a simple mock image file with basic EXIF-like metadata
    const metadata = {
      filename: filename,
      camera: 'iPhone 13 Pro',
      date: faker.date.recent().toISOString(),
      location: filename.includes('vacation') ? 'Hawaii, USA' : 'San Francisco, CA',
      size: Math.floor(Math.random() * 5000000) + 1000000 // 1-5MB
    };

    return `MOCK_IMAGE_DATA\n${JSON.stringify(metadata, null, 2)}\nEND_MOCK_IMAGE`;
  }

  generateMockVideoData(filename) {
    const metadata = {
      filename: filename,
      duration: Math.floor(Math.random() * 300) + 30, // 30-330 seconds
      resolution: '1920x1080',
      codec: 'H.264',
      date: faker.date.recent().toISOString(),
      size: Math.floor(Math.random() * 50000000) + 10000000 // 10-50MB
    };

    return `MOCK_VIDEO_DATA\n${JSON.stringify(metadata, null, 2)}\nEND_MOCK_VIDEO`;
  }

  generateMockAudioData(filename) {
    const metadata = {
      filename: filename,
      duration: Math.floor(Math.random() * 300) + 60, // 1-5 minutes
      bitrate: '320kbps',
      format: filename.includes('.wav') ? 'WAV' : 'MP3',
      date: faker.date.recent().toISOString(),
      size: Math.floor(Math.random() * 10000000) + 2000000 // 2-10MB
    };

    return `MOCK_AUDIO_DATA\n${JSON.stringify(metadata, null, 2)}\nEND_MOCK_AUDIO`;
  }

  generateResumeContent() {
    return `
RESUME - ${faker.person.fullName()}

CONTACT INFORMATION
Email: ${faker.internet.email()}
Phone: ${faker.phone.number()}
Address: ${faker.location.streetAddress()}, ${faker.location.city()}, ${faker.location.state()}

EXPERIENCE
Software Engineer at ${faker.company.name()} (2020-2023)
- Developed web applications using React and Node.js
- Led team of 5 developers on major product initiatives
- Increased application performance by 40%

EDUCATION
Bachelor of Science in Computer Science
${faker.company.name()} University (2016-2020)

SKILLS
- Programming: JavaScript, Python, React, Node.js
- Tools: Git, Docker, AWS, MongoDB
- Languages: English (Native), Spanish (Conversational)
`;
  }

  generateInvoiceContent() {
    return `
INVOICE #INV-${Math.floor(Math.random() * 10000)}

From: ${faker.company.name()}
${faker.location.streetAddress()}
${faker.location.city()}, ${faker.location.state()} ${faker.location.zipCode()}

To: ${faker.person.fullName()}
${faker.location.streetAddress()}
${faker.location.city()}, ${faker.location.state()} ${faker.location.zipCode()}

Date: ${faker.date.recent().toLocaleDateString()}
Due Date: ${faker.date.future().toLocaleDateString()}

ITEMS:
- Web Development Services: $2,500.00
- UI/UX Design: $1,200.00
- Project Management: $800.00

TOTAL: $4,500.00

Payment Terms: Net 30 days
`;
  }

  generateContractContent() {
    return `
SERVICE AGREEMENT

This Agreement is made between ${faker.company.name()} ("Client") and ${faker.company.name()} ("Service Provider").

SCOPE OF WORK:
The Service Provider agrees to provide web development and design services including:
- Website development using modern technologies
- Responsive design implementation
- Content management system integration
- Search engine optimization

TIMELINE:
Project start date: ${faker.date.recent().toLocaleDateString()}
Expected completion: ${faker.date.future().toLocaleDateString()}

PAYMENT TERMS:
Total project cost: $15,000
Payment schedule: 50% upfront, 50% upon completion

SIGNATURES:
Client: ___________________ Date: ___________
Service Provider: ___________________ Date: ___________
`;
  }

  generateMeetingNotes() {
    return `
MEETING NOTES - Product Planning Session

Date: ${faker.date.recent().toLocaleDateString()}
Attendees: ${faker.person.fullName()}, ${faker.person.fullName()}, ${faker.person.fullName()}

AGENDA:
1. Q4 Product Roadmap Review
2. User Feedback Analysis
3. Resource Allocation Discussion

DISCUSSION:
- Reviewed customer feedback from last quarter
- Identified key features for next release
- Discussed timeline and resource requirements
- Agreed on priority levels for upcoming features

ACTION ITEMS:
- ${faker.person.firstName()} to create detailed feature specifications by Friday
- ${faker.person.firstName()} to review technical feasibility
- Schedule follow-up meeting for next week

NEXT STEPS:
Continue with detailed planning and begin development sprint planning
`;
  }

  generateReportContent() {
    return `
QUARTERLY BUSINESS REPORT

Company: ${faker.company.name()}
Quarter: Q3 2023
Prepared by: ${faker.person.fullName()}

EXECUTIVE SUMMARY:
This quarter showed strong growth across all major metrics. Revenue increased by 25% compared to the previous quarter, driven by new product launches and expanded market reach.

KEY METRICS:
- Revenue: $${(Math.random() * 1000000 + 500000).toLocaleString()}
- New Customers: ${Math.floor(Math.random() * 1000 + 200)}
- Customer Retention: 94%
- Market Share: 12.5%

CHALLENGES:
- Supply chain disruptions affected delivery times
- Increased competition in core markets
- Need for additional technical staff

RECOMMENDATIONS:
1. Expand customer support team
2. Invest in automation technology
3. Develop strategic partnerships
4. Increase marketing budget by 15%

CONCLUSION:
Strong performance this quarter positions us well for continued growth.
`;
  }

  generateRecipeContent() {
    return `
FAVORITE RECIPES COLLECTION

1. CHOCOLATE CHIP COOKIES
Ingredients:
- 2 cups all-purpose flour
- 1 cup butter, softened
- 3/4 cup brown sugar
- 1/2 cup granulated sugar
- 2 eggs
- 2 cups chocolate chips

Instructions:
1. Preheat oven to 375°F
2. Mix dry ingredients in bowl
3. Cream butter and sugars, add eggs
4. Combine wet and dry ingredients
5. Fold in chocolate chips
6. Bake for 9-11 minutes

2. PASTA MARINARA
Ingredients:
- 1 lb pasta
- 2 cans crushed tomatoes
- 4 cloves garlic, minced
- 1 onion, diced
- Fresh basil
- Olive oil, salt, pepper

Instructions:
1. Cook pasta according to package directions
2. Sauté onion and garlic in olive oil
3. Add tomatoes, season with salt and pepper
4. Simmer 20 minutes
5. Toss with pasta and fresh basil
`;
  }

  generateTravelContent() {
    return `
TRAVEL ITINERARY - ${faker.location.city()} Trip

Trip Dates: ${faker.date.future().toLocaleDateString()} - ${faker.date.future().toLocaleDateString()}
Travelers: ${faker.person.fullName()}, ${faker.person.fullName()}

FLIGHT INFORMATION:
Departure: ${faker.date.future().toLocaleString()}
Flight: ${faker.airline.flightNumber()}
Airport: ${faker.airline.airport().name}

ACCOMMODATION:
Hotel: ${faker.company.name()} Hotel
Address: ${faker.location.streetAddress()}, ${faker.location.city()}
Check-in: 3:00 PM
Check-out: 11:00 AM

ACTIVITIES:
Day 1: City tour, visit ${faker.location.city()} Museum
Day 2: ${faker.location.city()} Beach, local restaurant dinner
Day 3: Shopping district, departure

EMERGENCY CONTACTS:
Embassy: ${faker.phone.number()}
Hotel Concierge: ${faker.phone.number()}
Travel Insurance: ${faker.phone.number()}

PACKING CHECKLIST:
- Passport and travel documents
- Appropriate clothing for weather
- Camera and chargers
- Medications
- Travel guides and maps
`;
  }

  generateSpreadsheetContent() {
    return `
MOCK_EXCEL_DATA
Budget Tracking Spreadsheet

Category,Jan,Feb,Mar,Total
Rent,1200,1200,1200,3600
Groceries,400,450,425,1275
Utilities,150,175,160,485
Transportation,200,180,220,600
Entertainment,100,150,75,325
Total,2050,2155,2080,6285
`;
  }

  generatePresentationContent() {
    return `
MOCK_POWERPOINT_DATA
Company Quarterly Review Presentation

Slide 1: Title - Q3 2023 Review
Slide 2: Executive Summary
Slide 3: Financial Performance
Slide 4: Key Achievements
Slide 5: Challenges and Solutions
Slide 6: Q4 Outlook
Slide 7: Questions and Discussion

Speaker Notes:
- Emphasize positive growth trends
- Address supply chain concerns
- Highlight team achievements
- Present future opportunities
`;
  }
}

// Main execution
async function main() {
  const demoSetup = new DemoSetup();
  
  try {
    await demoSetup.createDemoFiles();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up demo files:', error);
    process.exit(1);
  }
}

// Check if running directly
if (require.main === module) {
  main();
}

module.exports = DemoSetup;

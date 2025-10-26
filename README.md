# Pakistan's Top Lawyers (PTL)

A modern web platform connecting overseas Pakistanis with verified lawyers in Pakistan. Built with Next.js 15, React 19, and TypeScript.

## 🚀 Features

- **Lawyer Directory**: Browse and search verified lawyers by city and practice area
- **AI-Powered Tools**: Document summarization, legal chat, and case law search
- **Authentication**: Secure user management with Clerk
- **Image Upload**: Cloudinary integration for profile pictures and documents
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **SEO Optimized**: Rich metadata and structured data for better search rankings

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: MongoDB with Mongoose
- **Authentication**: Clerk
- **Image Storage**: Cloudinary
- **AI Services**: Groq API
- **PDF Processing**: PDF.js
- **Animations**: Lottie React

## 📦 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ptl
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your environment variables in `.env.local`:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/ptl

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# AI Services
GROQ_API_KEY=your_groq_api_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── add-lawyer/        # Lawyer registration form
│   ├── lawyers/           # Lawyer directory
│   ├── services/          # Legal services pages
│   ├── api/               # API routes
│   └── globals.css        # Global styles
├── components/            # Reusable components
│   ├── ui/               # UI components
│   └── tools/            # Specialized tools
├── lib/                  # Utility functions
│   ├── mongodb.ts        # Database connection
│   ├── utils.ts          # Helper functions
│   ├── validations.ts    # Form validation
│   └── api.ts            # API utilities
└── models/               # Database models
    └── Lawyer.ts         # Lawyer schema
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🌐 API Endpoints

- `GET/POST /api/lawyers` - Lawyer CRUD operations
- `POST /api/chat` - AI legal chat
- `POST /api/summarize` - Document summarization
- `POST /api/casesearch` - Case law search

## 📱 Features Overview

### Lawyer Management
- Add new lawyers with profile pictures and license images
- Browse lawyers by city and practice area
- View detailed lawyer profiles

### AI Tools
- **Document Summarizer**: Upload PDFs for English/Urdu summaries and legal analysis
- **Legal Chat**: Ask questions about Pakistani law
- **Case Search**: Find relevant case laws and judgments

### SEO & Performance
- Optimized metadata for search engines
- Structured data (JSON-LD) for rich snippets
- Responsive images and lazy loading
- Fast loading with Next.js optimizations

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms
The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support, email contact@pakistantoplawyers.com or create an issue in the repository.

---

**Pakistan's Top Lawyers** - Connecting overseas Pakistanis with trusted legal professionals.
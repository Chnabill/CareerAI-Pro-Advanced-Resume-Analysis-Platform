# Environment Variables Setup

## Quick Setup

1. **Create a `.env` file** in the `backend` directory:
   ```bash
   cp .env.example .env
   ```

2. **Add your OpenRouter API Key** to the `.env` file:
   ```env
   OPENROUTER_API_KEY=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
   PORT=3001
   ```

3. **Install Python dependencies** (for API testing):
   ```bash
   pip install python-dotenv
   ```

## Important Notes

- ✅ The `.env` file is already in `.gitignore` - your API key will NOT be committed to Git
- ✅ Never share your `.env` file or commit it to version control
- ✅ Use `.env.example` as a template for other developers

## Getting Your API Key

If you need a new OpenRouter API key:
1. Visit [OpenRouter.ai](https://openrouter.ai/)
2. Sign up or log in
3. Go to API Keys section
4. Generate a new key
5. Add it to your `.env` file

## Testing

After setting up your `.env` file, test it:

**Backend Server:**
```bash
cd backend
npm run dev
```

**Python API Test:**
```bash
cd "backend/api test"
python apiTest.py
```

## Troubleshooting

If you get an error like "API key not found":
- Make sure `.env` file exists in the `backend` directory
- Check that `OPENROUTER_API_KEY` is spelled correctly
- Ensure there are no spaces around the `=` sign
- Restart your server after adding the `.env` file

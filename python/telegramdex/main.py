import logging
import requests
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes

# Replace 'YOUR_TOKEN_HERE' with your actual Telegram bot token
TELEGRAM_TOKEN = '7541334733:AAGu81XTyZXh5dDoex4KhlHJXuzvg5pcuPM'

# Set up logging
logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)
logger = logging.getLogger(__name__)

# Function to get token price from DEXScreener
def get_token_price(symbol: str) -> str:
    logger.info(f"Fetching price for {symbol}...")
    url = f"https://api.dexscreener.io/latest/dex/search?q={symbol}"
    
    # Add this line to print the exact URL being used
    print(f"DEBUG: Using URL: {url}")

    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        price = data.get('pair', {}).get('priceUsd', 'N/A')
        logger.info(f"Price fetched: ${price}")
        return price
    except requests.RequestException as e:
        logger.error(f"Failed to fetch price: {e}")
        return "N/A"

# Function to handle the /price command
async def price(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    logger.info("Received /price command")
    symbol = context.args[0] if context.args else None
    
    if symbol:
        price = get_token_price(symbol)
        await update.message.reply_text(f"The current price of {symbol} is: ${price}")
    else:
        await update.message.reply_text("Please provide a token symbol, e.g., /price SOL-USDT")
    logger.info("Reply sent")

def main() -> None:
    logger.info("Starting vladobot...")
    application = Application.builder().token(TELEGRAM_TOKEN).build()
    application.add_handler(CommandHandler('price', price))
    
    logger.info("Bot started, waiting for commands...")
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        logger.info("Bot stopped by user")
    except Exception as e:
        logger.error(f"An error occurred: {e}")

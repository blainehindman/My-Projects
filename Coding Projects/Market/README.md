# EOD Stock Analysis Platform

A comprehensive stock analysis and portfolio management platform built with Streamlit, featuring technical analysis, S&P 500 screening, and portfolio tracking.

## 🚀 Features

### 1. Stock Search and Analysis
- Individual stock lookup with customizable time periods
- Interactive candlestick charts
- Real-time price and volume metrics
- Data powered by Yahoo Finance

### 2. S&P 500 Analysis
- Bulk analysis of all S&P 500 stocks
- Multiple lookback periods (1D, 5D, 1M, 6M, 1Y, 5Y)
- Technical indicator calculations
- Buy signal detection based on multiple conditions
- Data powered by Alpaca API

### 3. Portfolio Management
- Track stock purchases and sales
- Log transactions with precise share amounts
- Calculate profits/losses and returns
- Monitor win rate and performance metrics
- Export transaction history
- Persistent data storage in JSON format

### 4. Technical Analysis
Three key technical indicators used for buy signals:

1. **RSI (Relative Strength Index)**
   - 14-day period
   - Buy signal when RSI < 30 (oversold)

2. **MACD (Moving Average Convergence Divergence)**
   - Fast EMA: 12 days
   - Slow EMA: 26 days
   - Signal Line: 9-day EMA
   - Buy signal on bullish crossover

3. **Bollinger Bands**
   - 20-day SMA with 2 standard deviations
   - Buy signal when price is below lower band

## 📋 Requirements

```
streamlit
pandas
yfinance
plotly
numpy
python-dotenv
alpaca-trade-api==3.0.2
ta
```

## 🔧 Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Create a `.env` file with your Alpaca API credentials:
   ```
   ALPACA_API_KEY=your_api_key
   ALPACA_API_SECRET=your_api_secret
   ALPACA_API_BASE_URL=https://paper-api.alpaca.markets
   ```

## 🚀 Usage

1. Run the application:
   ```bash
   streamlit run app.py
   ```

2. Navigate through the different pages:
   - **Search**: Look up individual stocks
   - **Analyze**: Screen S&P 500 stocks for buy signals
   - **Portfolio**: Manage your stock positions
   - **Definitions**: Learn about technical indicators

## 📊 Buy Signal Criteria

A stock generates a buy signal when ALL three conditions are met:
1. RSI is below 30 (oversold condition)
2. MACD shows a bullish crossover
3. Price is below the lower Bollinger Band

## 💼 Portfolio Management

- **Log Buys**: Record stock purchases with:
  - Symbol
  - Number of shares (up to 5 decimal places)
  - Purchase price
  - Buy date

- **Log Sells**: Record stock sales with:
  - Select position from portfolio
  - Sell price
  - Sell date

- **Track Performance**:
  - Win rate
  - Total profit/loss
  - Number of trades
  - Complete transaction history

## 💾 Data Storage

Portfolio data is stored locally in JSON format:
- `data/portfolio.json`: Current positions
- `data/transactions.json`: Historical transactions

## 📈 Analysis Output

Detailed analysis reports include:
- Date range and trading days
- Current price and period change
- Technical indicator values
- Buy condition status
- Final signal determination

## ⚠️ Notes

- Free Alpaca API accounts have limitations on data access
- Some features require active internet connection
- Historical data availability may vary by stock and time period

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
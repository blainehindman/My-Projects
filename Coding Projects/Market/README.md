# EOD Stock Analysis Platform

A comprehensive stock analysis and portfolio management platform that combines technical analysis with portfolio tracking capabilities.

## Features

### 1. Stock Analysis
- **Technical Analysis**: Advanced scoring system using multiple indicators
- **Buy Signals**: 20-point scoring system with 11 different conditions
- **Sell Signals**: 17-point scoring system with 10 different conditions
- **Real-time Data**: Integration with Alpaca API and Yahoo Finance fallback
- **S&P 500 Coverage**: Analyze all S&P 500 stocks simultaneously

### 2. Portfolio Management
- **Transaction Tracking**: Log buy and sell transactions with detailed metrics
- **Performance Analytics**: Track win rate, total profit/loss, and average returns
- **Signal Analysis**: Monitor buy/sell signal scores for each position
- **Historical Analysis**: View complete transaction history with signal details

### 3. Technical Indicators
- **Core Indicators**:
  - RSI (Relative Strength Index)
  - MACD (Moving Average Convergence Divergence)
  - Bollinger Bands
- **Enhanced Indicators**:
  - EMA 9/21 Crossovers
  - Stochastic RSI
  - OBV (On Balance Volume)
  - CCI (Commodity Channel Index)
  - ATR (Average True Range)
  - Volume Moving Averages

## Setup

1. **Environment Setup**
   ```bash
   # Create and activate virtual environment
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   
   # Install dependencies
   pip install -r requirements.txt
   ```

2. **API Configuration**
   Create a `.env` file with your Alpaca API credentials:
   ```
   ALPACA_API_KEY=your_api_key
   ALPACA_API_SECRET=your_api_secret
   ALPACA_API_BASE_URL=your_api_base_url
   ```

3. **Run the Application**
   ```bash
   streamlit run app.py
   ```

## Usage

### Search Page
- Search individual stocks
- View detailed price charts
- Analyze technical indicators
- Monitor real-time metrics

### Analyze Page
- Scan entire S&P 500 for opportunities
- View buy signals (score ≥ 13)
- Monitor sell signals (score ≥ 11)
- Download analysis results

### Portfolio Page
- Log buy and sell transactions
- Track current positions
- Monitor portfolio performance
- View transaction history
- Analyze signal effectiveness

### Definitions Page
- Detailed explanation of indicators
- Signal criteria and thresholds
- Technical analysis formulas
- Interpretation guidelines

## Signal System

### Buy Signals (20-point scale)
1. RSI < 30 (3 points)
2. MACD Bullish Crossover (3 points)
3. Price below BB (2 points)
4. EMA 9/21 Bullish Crossover (2 points)
5. High Volume (2 points)
6. Stochastic RSI < 20 & Rising (1 point)
7. OBV Upward Trend (1 point)
8. CCI < -100 (1 point)
9. ATR Increasing (1 point)
10. Bullish Candlestick (2 points)
11. Additional Volume Analysis (2 points)

### Sell Signals (17-point scale)
1. RSI > 70 (3 points)
2. MACD Bearish Crossover (3 points)
3. Price above BB (2 points)
4. EMA 9/21 Bearish Crossover (2 points)
5. Volume Spike on Down Candle (2 points)
6. Stochastic RSI > 80 & Falling (1 point)
7. OBV Falling (1 point)
8. CCI > 100 (1 point)
9. Bearish Candlestick (2 points)

## Data Storage
- Portfolio data stored in `data/portfolio.json`
- Transaction history stored in `data/transactions.json`
- Automatic data persistence between sessions

## Dependencies
- streamlit
- pandas
- yfinance
- plotly
- alpaca-trade-api
- ta (Technical Analysis library)
- python-dotenv

## Contributing
Feel free to submit issues and enhancement requests! 
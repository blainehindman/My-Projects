# 📈 S&P 500 Advanced Trading Signal Analyzer

A sophisticated trading analysis tool that scans the S&P 500 for high-probability short-term trading opportunities using multiple technical indicators and backtesting.

## 🎯 What It Does

This analyzer combines multiple technical indicators to identify stocks with high-probability short-term trading opportunities. It uses a multi-factor approach to generate signals and validates them through historical backtesting.

### Key Features

- Analyzes all S&P 500 stocks
- Uses multiple technical indicators
- Performs historical backtesting
- Generates probability scores
- Provides comprehensive Excel output
- Real-time signal monitoring

## 📊 Technical Indicators Used

1. **Momentum Indicators**
   - RSI (Relative Strength Index)
     - Primary oversold threshold: < 40
     - Secondary threshold: < 45
   - MACD (Moving Average Convergence Divergence)
     - Strong momentum: > 0.05
     - Neutral: > -0.02
   - Stochastic Oscillator
     - Used for oversold confirmation

2. **Trend Indicators**
   - ADX (Average Directional Index)
     - Strong trend: > 20
     - Moderate trend: > 15
   - EMA (Exponential Moving Average)
     - 20-day and 50-day crossovers
     - Price position relative to EMAs

3. **Volatility Indicators**
   - Bollinger Bands
     - Price within 5% of lower band
     - Band width analysis
   - Volatility Ratio
     - Acceptable range: 0.6 - 2.0

4. **Volume Indicators**
   - Volume Trend (5-day vs 20-day)
     - Strong: > 20% above average
     - Moderate: > 0% above average
   - Volume Consistency
     - High volume in majority of recent days

## 💡 Signal Generation

### Probability Score (100 points max)

#### Price Action (30 points)
- 15 points: Near Bollinger Band support
- 15 points: Positive trend
- 10 points: Slightly negative trend (> -2%)

#### Momentum (25 points)
- 15 points: RSI < 40
- 10 points: RSI < 45
- 10 points: MACD > 0.05
- 5 points: MACD > -0.02

#### Volume (25 points)
- 15 points: Volume > 20% above average with consistency
- 10 points: Volume > base level
- 10 points: Volume trend > 5%
- 5 points: Volume trend > 0%

#### Technical Strength (20 points)
- 10 points: ADX > 20
- 5 points: ADX > 15
- 10 points: EMA alignment
- 5 points: Price > EMA50

### Signal Requirements

A stock must meet ONE of these setups AND score ≥ 65 points:

1. **Oversold Reversal Setup**
   - RSI < 40 AND
   - (MACD > 0.05 OR Price near BB support)

2. **Strong Trend Setup**
   - ADX > 20 AND
   - (Volume 20% above average OR Healthy volatility)

3. **Support Bounce Setup**
   - Price near BB support AND
   - Volume 20% above average

4. **Technical Confluence Setup**
   - MACD > 0.05 AND
   - ADX > 20 AND
   - Healthy volatility

## 📈 Backtesting Criteria

Each signal must pass historical validation:
- Win rate > 55%
- Average return > 1.5%
- Sharpe ratio > 1.0
- Minimum 3 historical signals
- Measures 5-day forward returns

## 📑 Output Files

The analyzer generates 'trading_analysis.xlsx' with three sheets:

1. **All Analysis**
   - Complete analysis of all S&P 500 stocks
   - All technical indicators and metrics
   - Raw probability scores

2. **Active Signals**
   - Stocks currently meeting signal criteria
   - Current technical indicator values
   - Probability scores and metrics

3. **Strong Signals**
   - Highest probability opportunities
   - Signals with backtest confirmation
   - Complete metrics and analysis

## 🔍 Key Metrics in Output

- Ticker symbol
- Current price
- Signal probability score
- RSI value
- MACD differential
- ADX trend strength
- Volume trend
- Win rate (from backtesting)
- Average 5-day return
- Signal status
- Backtest confirmation

## 🚀 How to Run

1. Set up your Alpaca API credentials in .env:
```
ALPACA_API_KEY=your_key
ALPACA_API_SECRET=your_secret
ALPACA_API_BASE_URL=https://paper-api.alpaca.markets
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the analyzer:
```bash
python app.py
```

## 📋 Requirements

- Python 3.7+
- Alpaca API account (free tier works)
- Required Python packages (in requirements.txt)
- Internet connection for market data

## ⚠️ Important Notes

- Best run after market hours for complete daily data
- Uses Alpaca's basic (free) market data
- Past performance doesn't guarantee future results
- Always do your own due diligence
- Consider using paper trading first

## 🔄 Signal Updates

The analyzer provides real-time updates during scanning:
- Progress indicators
- Strong signal alerts
- Key metrics for each signal
- Summary statistics

## 📊 Understanding Results

- **Signal Probability**: Higher is better (max 100)
- **Win Rate**: Historical success rate (> 55% required)
- **Average Return**: Expected 5-day return based on history
- **Signal Active**: Current signal status
- **Backtest Support**: Historical validation

Always review the complete metrics in the Excel output and conduct your own additional analysis before making trading decisions.

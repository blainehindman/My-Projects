import streamlit as st
import pandas as pd
import yfinance as yf
import plotly.graph_objects as go
from datetime import datetime, timedelta
import numpy as np
from dotenv import load_dotenv
import os
import alpaca_trade_api as tradeapi
import traceback
import ta  # Technical Analysis library
import uuid  # For generating unique transaction IDs
import json
from pathlib import Path
import time

# Load environment variables
load_dotenv()

# Define file paths
DATA_DIR = Path("data")
PORTFOLIO_FILE = DATA_DIR / "portfolio.json"
TRANSACTIONS_FILE = DATA_DIR / "transactions.json"

# Create data directory if it doesn't exist
DATA_DIR.mkdir(exist_ok=True)

def load_portfolio_data():
    """Load portfolio data from JSON files."""
    try:
        if PORTFOLIO_FILE.exists():
            with open(PORTFOLIO_FILE, 'r') as f:
                portfolio_data = json.load(f)
                portfolio_df = pd.DataFrame(portfolio_data) if portfolio_data else pd.DataFrame(
                    columns=['ID', 'Symbol', 'Shares', 'Buy Price', 'Buy Date', 'Total Cost', 'Buy Score', 'Buy Conditions'])
        else:
            portfolio_df = pd.DataFrame(columns=['ID', 'Symbol', 'Shares', 'Buy Price', 'Buy Date', 'Total Cost', 'Buy Score', 'Buy Conditions'])
        
        if TRANSACTIONS_FILE.exists():
            with open(TRANSACTIONS_FILE, 'r') as f:
                transactions_data = json.load(f)
                transactions_df = pd.DataFrame(transactions_data) if transactions_data else pd.DataFrame(
                    columns=['ID', 'Symbol', 'Shares', 'Buy Price', 'Sell Price', 'Buy Date', 'Sell Date', 'Profit/Loss', 'Return %', 'Buy Score', 'Sell Score', 'Buy Conditions', 'Sell Conditions'])
        else:
            transactions_df = pd.DataFrame(columns=['ID', 'Symbol', 'Shares', 'Buy Price', 'Sell Price', 'Buy Date', 'Sell Date', 'Profit/Loss', 'Return %', 'Buy Score', 'Sell Score', 'Buy Conditions', 'Sell Conditions'])
        
        # Calculate statistics
        total_profit = transactions_df['Profit/Loss'].sum() if not transactions_df.empty else 0.0
        total_trades = len(transactions_df)
        win_count = len(transactions_df[transactions_df['Profit/Loss'] > 0])
        
        return portfolio_df, transactions_df, total_profit, total_trades, win_count
    
    except Exception as e:
        st.error(f"Error loading portfolio data: {str(e)}")
        return (pd.DataFrame(columns=['ID', 'Symbol', 'Shares', 'Buy Price', 'Buy Date', 'Total Cost', 'Buy Score', 'Buy Conditions']),
                pd.DataFrame(columns=['ID', 'Symbol', 'Shares', 'Buy Price', 'Sell Price', 'Buy Date', 'Sell Date', 'Profit/Loss', 'Return %', 'Buy Score', 'Sell Score', 'Buy Conditions', 'Sell Conditions']),
                0.0, 0, 0)

def save_portfolio_data(portfolio_df, transactions_df):
    """Save portfolio data to JSON files."""
    try:
        # Convert DataFrames to JSON-compatible format
        portfolio_data = portfolio_df.to_dict('records') if not portfolio_df.empty else []
        transactions_data = transactions_df.to_dict('records') if not transactions_df.empty else []
        
        # Save to files
        with open(PORTFOLIO_FILE, 'w') as f:
            json.dump(portfolio_data, f, indent=2, default=str)
        
        with open(TRANSACTIONS_FILE, 'w') as f:
            json.dump(transactions_data, f, indent=2, default=str)
            
    except Exception as e:
        st.error(f"Error saving portfolio data: {str(e)}")

# Initialize session state for data persistence
if 'sp500_data' not in st.session_state:
    st.session_state.sp500_data = None
if 'buy_signals' not in st.session_state:
    st.session_state.buy_signals = None
if 'sell_signals' not in st.session_state:
    st.session_state.sell_signals = None
if 'near_buy_signals_data' not in st.session_state:
    st.session_state.near_buy_signals_data = None
if 'last_analysis_time' not in st.session_state:
    st.session_state.last_analysis_time = None
if 'search_symbol' not in st.session_state:
    st.session_state.search_symbol = "AAPL"
if 'search_period' not in st.session_state:
    st.session_state.search_period = "6mo"
if 'search_data' not in st.session_state:
    st.session_state.search_data = None
if 'search_time' not in st.session_state:
    st.session_state.search_time = None

# Load portfolio data from files
(st.session_state.portfolio,
 st.session_state.transactions,
 st.session_state.total_profit,
 st.session_state.total_trades,
 st.session_state.win_count) = load_portfolio_data()

# Initialize Alpaca API
ALPACA_API_KEY = os.getenv('ALPACA_API_KEY')
ALPACA_API_SECRET = os.getenv('ALPACA_API_SECRET')
ALPACA_API_BASE_URL = os.getenv('ALPACA_API_BASE_URL')

# Initialize session state for data persistence
if 'sp500_data' not in st.session_state:
    st.session_state.sp500_data = None
if 'buy_signals' not in st.session_state:
    st.session_state.buy_signals = None
if 'sell_signals' not in st.session_state:
    st.session_state.sell_signals = None
if 'near_buy_signals_data' not in st.session_state:
    st.session_state.near_buy_signals_data = None
if 'last_analysis_time' not in st.session_state:
    st.session_state.last_analysis_time = None
if 'search_symbol' not in st.session_state:
    st.session_state.search_symbol = "AAPL"
if 'search_period' not in st.session_state:
    st.session_state.search_period = "6mo"
if 'search_data' not in st.session_state:
    st.session_state.search_data = None
if 'search_time' not in st.session_state:
    st.session_state.search_time = None

# Initialize portfolio session state
if 'portfolio' not in st.session_state:
    st.session_state.portfolio = pd.DataFrame(columns=['ID', 'Symbol', 'Shares', 'Buy Price', 'Buy Date', 'Total Cost'])
if 'transactions' not in st.session_state:
    st.session_state.transactions = pd.DataFrame(columns=['ID', 'Symbol', 'Shares', 'Buy Price', 'Sell Price', 'Buy Date', 'Sell Date', 'Profit/Loss', 'Return %'])
if 'total_profit' not in st.session_state:
    st.session_state.total_profit = 0.0
if 'win_count' not in st.session_state:
    st.session_state.win_count = 0
if 'total_trades' not in st.session_state:
    st.session_state.total_trades = 0

# Initialize Alpaca API
try:
    api = tradeapi.REST(
        ALPACA_API_KEY,
        ALPACA_API_SECRET,
        ALPACA_API_BASE_URL,
        api_version='v2'
    )
except Exception as e:
    st.error("Error initializing Alpaca API. Please check your credentials.")
    st.error(f"Error details: {str(e)}")

# Set page configuration
st.set_page_config(
    page_title="EOD Stock Analysis Platform",
    page_icon="📈",
    layout="wide"
)

# Add title
st.title("📈 EOD Stock Analysis Platform")

# Sidebar navigation
with st.sidebar:
    st.title("Navigation")
    page = st.radio("Select Page", ["Search", "Analyze", "Portfolio", "Definitions"])

def get_sp500_symbols():
    # Using Wikipedia to get S&P 500 symbols
    table = pd.read_html('https://en.wikipedia.org/wiki/List_of_S%26P_500_companies')
    df = table[0]
    return df['Symbol'].tolist()

def get_start_date(lookback):
    """Convert lookback period to start date."""
    today = datetime.now()
    
    if lookback == "1D":
        return today - timedelta(days=1)
    elif lookback == "5D":
        return today - timedelta(days=5)
    elif lookback == "1M":
        return today - timedelta(days=30)
    elif lookback == "6M":
        return today - timedelta(days=180)
    elif lookback == "1Y":
        return today - timedelta(days=365)
    elif lookback == "5Y":
        return today - timedelta(days=365 * 5)
    else:
        return today - timedelta(days=5)  # Default to 5 days

def calculate_technical_indicators(df):
    # Calculate RSI
    df['RSI'] = ta.momentum.RSIIndicator(df['close'], window=14).rsi()
    
    # Calculate MACD
    macd = ta.trend.MACD(df['close'])
    df['MACD'] = macd.macd()
    df['MACD_Signal'] = macd.macd_signal()
    
    # Calculate Bollinger Bands
    bollinger = ta.volatility.BollingerBands(df['close'])
    df['BB_lower'] = bollinger.bollinger_lband()
    df['BB_upper'] = bollinger.bollinger_hband()
    
    return df

def calculate_enhanced_indicators(df):
    """Calculate additional technical indicators for the scoring system."""
    # Calculate EMAs
    df['EMA_9'] = ta.trend.EMAIndicator(df['close'], window=9).ema_indicator()
    df['EMA_21'] = ta.trend.EMAIndicator(df['close'], window=21).ema_indicator()
    
    # Calculate Stochastic RSI
    stoch_rsi = ta.momentum.StochRSIIndicator(df['close'])
    df['Stoch_RSI'] = stoch_rsi.stochrsi()
    
    # Calculate OBV (On Balance Volume)
    df['OBV'] = ta.volume.OnBalanceVolumeIndicator(df['close'], df['volume']).on_balance_volume()
    
    # Calculate CCI (Commodity Channel Index)
    df['CCI'] = ta.trend.CCIIndicator(df['high'], df['low'], df['close']).cci()
    
    # Calculate ATR (Average True Range)
    df['ATR'] = ta.volatility.AverageTrueRange(df['high'], df['low'], df['close']).average_true_range()
    
    # Calculate Volume MA
    df['Volume_MA20'] = df['volume'].rolling(window=20).mean()
    
    return df

def calculate_buy_score(df):
    """Calculate buy signal score based on technical indicators."""
    score = 0
    conditions_met = []
    
    # RSI < 30
    if df['RSI'].iloc[-1] < 30:
        score += 3
        conditions_met.append("RSI < 30")
    
    # MACD Bullish Crossover
    macd_prev = df['MACD'].iloc[-2] - df['MACD_Signal'].iloc[-2]
    macd_curr = df['MACD'].iloc[-1] - df['MACD_Signal'].iloc[-1]
    if macd_prev < 0 and macd_curr > 0:
        score += 3
        conditions_met.append("MACD Bullish Crossover")
    
    # Price below lower Bollinger Band
    if df['close'].iloc[-1] < df['BB_lower'].iloc[-1]:
        score += 2
        conditions_met.append("Price below BB")
    
    # EMA 9/21 Bullish Crossover
    ema_prev = df['EMA_9'].iloc[-2] - df['EMA_21'].iloc[-2]
    ema_curr = df['EMA_9'].iloc[-1] - df['EMA_21'].iloc[-1]
    if ema_prev < 0 and ema_curr > 0:
        score += 2
        conditions_met.append("EMA Bullish Crossover")
    
    # Volume > 1.5x 20-day average
    if df['volume'].iloc[-1] > df['Volume_MA20'].iloc[-1] * 1.5:
        score += 2
        conditions_met.append("High Volume")
    
    # Stochastic RSI < 20 and rising
    if df['Stoch_RSI'].iloc[-1] < 0.2 and df['Stoch_RSI'].iloc[-1] > df['Stoch_RSI'].iloc[-2]:
        score += 1
        conditions_met.append("Stoch RSI < 20 & Rising")
    
    # OBV trending upward
    if df['OBV'].iloc[-1] > df['OBV'].iloc[-2] > df['OBV'].iloc[-3]:
        score += 1
        conditions_met.append("OBV Upward Trend")
    
    # CCI below -100
    if df['CCI'].iloc[-1] < -100:
        score += 1
        conditions_met.append("CCI < -100")
    
    # ATR increasing
    if df['ATR'].iloc[-1] > df['ATR'].iloc[-2]:
        score += 1
        conditions_met.append("ATR Increasing")
    
    # Candlestick patterns (simplified check for bullish reversal)
    if (df['close'].iloc[-1] > df['open'].iloc[-1] and  # Bullish candle
        df['close'].iloc[-1] > df['close'].iloc[-2]):   # Higher close than previous
        score += 2
        conditions_met.append("Bullish Candlestick")
    
    return score, conditions_met

def calculate_sell_score(df):
    """Calculate sell signal score based on technical indicators."""
    score = 0
    conditions_met = []
    
    # RSI > 70
    if df['RSI'].iloc[-1] > 70:
        score += 3
        conditions_met.append("RSI > 70")
    
    # MACD Bearish Crossover
    macd_prev = df['MACD'].iloc[-2] - df['MACD_Signal'].iloc[-2]
    macd_curr = df['MACD'].iloc[-1] - df['MACD_Signal'].iloc[-1]
    if macd_prev > 0 and macd_curr < 0:
        score += 3
        conditions_met.append("MACD Bearish Crossover")
    
    # Price above upper Bollinger Band
    if df['close'].iloc[-1] > df['BB_upper'].iloc[-1]:
        score += 2
        conditions_met.append("Price above BB")
    
    # EMA 9/21 Bearish Crossover
    ema_prev = df['EMA_9'].iloc[-2] - df['EMA_21'].iloc[-2]
    ema_curr = df['EMA_9'].iloc[-1] - df['EMA_21'].iloc[-1]
    if ema_prev > 0 and ema_curr < 0:
        score += 2
        conditions_met.append("EMA Bearish Crossover")
    
    # Volume spike on down candle
    if (df['close'].iloc[-1] < df['open'].iloc[-1] and 
        df['volume'].iloc[-1] > df['Volume_MA20'].iloc[-1] * 1.5):
        score += 2
        conditions_met.append("Volume Spike on Down Candle")
    
    # Stochastic RSI > 80 and falling
    if df['Stoch_RSI'].iloc[-1] > 0.8 and df['Stoch_RSI'].iloc[-1] < df['Stoch_RSI'].iloc[-2]:
        score += 1
        conditions_met.append("Stoch RSI > 80 & Falling")
    
    # OBV falling
    if df['OBV'].iloc[-1] < df['OBV'].iloc[-2] < df['OBV'].iloc[-3]:
        score += 1
        conditions_met.append("OBV Falling")
    
    # CCI above +100
    if df['CCI'].iloc[-1] > 100:
        score += 1
        conditions_met.append("CCI > 100")
    
    # Candlestick patterns (simplified check for bearish reversal)
    if (df['close'].iloc[-1] < df['open'].iloc[-1] and  # Bearish candle
        df['close'].iloc[-1] < df['close'].iloc[-2]):   # Lower close than previous
        score += 2
        conditions_met.append("Bearish Candlestick")
    
    return score, conditions_met

def check_buy_conditions(df, symbol):
    if len(df) < 2:  # Need at least 2 data points for MACD crossover
        print(f"\n{symbol}: Insufficient data points (need at least 2, got {len(df)})")
        return False, 0, []
    
    # Get date range info
    start_date = df.index[0].strftime('%Y-%m-%d')
    end_date = df.index[-1].strftime('%Y-%m-%d')
    total_days = len(df)
    
    # Calculate enhanced indicators
    df = calculate_enhanced_indicators(df)
    
    # Check original conditions
    rsi_condition = df['RSI'].iloc[-1] < 30
    macd_prev = df['MACD'].iloc[-2] - df['MACD_Signal'].iloc[-2]
    macd_curr = df['MACD'].iloc[-1] - df['MACD_Signal'].iloc[-1]
    macd_condition = macd_prev < 0 and macd_curr > 0
    bb_condition = df['close'].iloc[-1] < df['BB_lower'].iloc[-1]
    
    # Calculate score
    score, conditions_met = calculate_buy_score(df)
    
    # Count conditions met
    conditions_met_count = sum([rsi_condition, macd_condition, bb_condition])
    
    # Print detailed analysis
    print(f"\n{'='*50}")
    print(f"Analysis Report for {symbol}")
    print(f"{'='*50}")
    print(f"Date Range: {start_date} to {end_date} ({total_days} trading days)")
    
    print(f"\nPrice Information:")
    print(f"Current Price: ${df['close'].iloc[-1]:.2f}")
    print(f"Previous Close: ${df['close'].iloc[-2]:.2f}")
    print(f"Period Change: {((df['close'].iloc[-1] - df['close'].iloc[0]) / df['close'].iloc[0] * 100):.2f}%")
    
    print(f"\nOriginal Buy Conditions ({conditions_met_count}/3):")
    print(f"1. RSI < 30: {'✅' if rsi_condition else '❌'}")
    print(f"   Current RSI: {df['RSI'].iloc[-1]:.2f}")
    print(f"   Previous RSI: {df['RSI'].iloc[-2]:.2f}")
    
    print(f"\n2. MACD Bullish Crossover: {'✅' if macd_condition else '❌'}")
    print(f"   Current MACD: {df['MACD'].iloc[-1]:.4f}")
    print(f"   Current Signal: {df['MACD_Signal'].iloc[-1]:.4f}")
    print(f"   Current Difference: {macd_curr:.4f}")
    print(f"   Previous Difference: {macd_prev:.4f}")
    
    print(f"\n3. Price Below BB: {'✅' if bb_condition else '❌'}")
    print(f"   Current Price: ${df['close'].iloc[-1]:.2f}")
    print(f"   Lower BB: ${df['BB_lower'].iloc[-1]:.2f}")
    print(f"   Distance from BB: ${abs(df['close'].iloc[-1] - df['BB_lower'].iloc[-1]):.2f}")
    
    print(f"\nEnhanced Scoring System (Score: {score}/20):")
    print("Conditions Met:")
    for condition in conditions_met:
        print(f"✅ {condition}")
    
    # Return both original and enhanced signals
    original_signal = rsi_condition and macd_condition and bb_condition
    enhanced_signal = score >= 12
    
    print(f"\nFinal Results:")
    print(f"Original System: {'🎯 BUY SIGNAL' if original_signal else '⏳ NO SIGNAL'}")
    print(f"Enhanced System: {'🎯 BUY SIGNAL' if enhanced_signal else '⏳ NO SIGNAL'}")
    print(f"{'='*50}\n")
    
    return original_signal or enhanced_signal, score, conditions_met

def check_sell_conditions(df, symbol):
    """Check if a stock meets the sell conditions."""
    if len(df) < 2:  # Need at least 2 data points for MACD crossover
        print(f"\n{symbol}: Insufficient data points (need at least 2, got {len(df)})")
        return False, 0, []
    
    # Get date range info
    start_date = df.index[0].strftime('%Y-%m-%d')
    end_date = df.index[-1].strftime('%Y-%m-%d')
    total_days = len(df)
    
    # Calculate enhanced indicators
    df = calculate_enhanced_indicators(df)
    
    # Check original conditions
    rsi_condition = df['RSI'].iloc[-1] > 70
    macd_prev = df['MACD'].iloc[-2] - df['MACD_Signal'].iloc[-2]
    macd_curr = df['MACD'].iloc[-1] - df['MACD_Signal'].iloc[-1]
    macd_condition = macd_prev > 0 and macd_curr < 0
    bb_condition = df['close'].iloc[-1] > df['BB_upper'].iloc[-1]
    
    # Calculate score
    score, conditions_met = calculate_sell_score(df)
    
    # Count conditions met (need 2 out of 3)
    conditions_met_count = sum([rsi_condition, macd_condition, bb_condition])
    
    # Print detailed analysis
    print(f"\n{'='*50}")
    print(f"Sell Analysis Report for {symbol}")
    print(f"{'='*50}")
    print(f"Date Range: {start_date} to {end_date} ({total_days} trading days)")
    
    print(f"\nPrice Information:")
    print(f"Current Price: ${df['close'].iloc[-1]:.2f}")
    print(f"Previous Close: ${df['close'].iloc[-2]:.2f}")
    print(f"Period Change: {((df['close'].iloc[-1] - df['close'].iloc[0]) / df['close'].iloc[0] * 100):.2f}%")
    
    print(f"\nOriginal Sell Conditions ({conditions_met_count}/3, need 2/3):")
    print(f"1. RSI > 70: {'✅' if rsi_condition else '❌'}")
    print(f"   Current RSI: {df['RSI'].iloc[-1]:.2f}")
    print(f"   Previous RSI: {df['RSI'].iloc[-2]:.2f}")
    
    print(f"\n2. MACD Bearish Crossover: {'✅' if macd_condition else '❌'}")
    print(f"   Current MACD: {df['MACD'].iloc[-1]:.4f}")
    print(f"   Current Signal: {df['MACD_Signal'].iloc[-1]:.4f}")
    print(f"   Current Difference: {macd_curr:.4f}")
    print(f"   Previous Difference: {macd_prev:.4f}")
    
    print(f"\n3. Price Above BB: {'✅' if bb_condition else '❌'}")
    print(f"   Current Price: ${df['close'].iloc[-1]:.2f}")
    print(f"   Upper BB: ${df['BB_upper'].iloc[-1]:.2f}")
    print(f"   Distance from BB: ${abs(df['close'].iloc[-1] - df['BB_upper'].iloc[-1]):.2f}")
    
    print(f"\nEnhanced Scoring System (Score: {score}/17):")
    print("Conditions Met:")
    for condition in conditions_met:
        print(f"✅ {condition}")
    
    # Return both original and enhanced signals
    original_signal = conditions_met_count >= 2
    enhanced_signal = score >= 10
    
    print(f"\nFinal Results:")
    print(f"Original System: {'🔴 SELL SIGNAL' if original_signal else '⏳ NO SIGNAL'}")
    print(f"Enhanced System: {'🔴 SELL SIGNAL' if enhanced_signal else '⏳ NO SIGNAL'}")
    print(f"{'='*50}\n")
    
    return original_signal or enhanced_signal, score, conditions_met

def search_page():
    st.markdown("""
    Search and analyze individual stocks using market data.
    """)
    
    # Search inputs with session state
    symbol = st.text_input("Enter Stock Symbol", value=st.session_state.search_symbol).upper()
    
    # Convert period options to more appropriate names for Alpaca
    period_options = {"1 Month": "1mo", "3 Months": "3mo", "6 Months": "6mo", 
                     "1 Year": "1y", "2 Years": "2y", "5 Years": "5y"}
    period_display = st.selectbox(
        "Select Time Period",
        options=list(period_options.keys()),
        index=list(period_options.values()).index(st.session_state.search_period) if st.session_state.search_period in period_options.values() else 2
    )
    period = period_options[period_display]

    # Add refresh button and last search time display
    col1, col2 = st.columns([2,3])
    with col1:
        search_button = st.button("Search Stock")
    with col2:
        if st.session_state.search_time:
            st.text(f"Last searched: {st.session_state.search_time.strftime('%Y-%m-%d %H:%M:%S')}")

    # Update session state
    st.session_state.search_symbol = symbol
    st.session_state.search_period = period

    if search_button or st.session_state.search_data is None:
        try:
            # Calculate start date based on period
            end_date = datetime.now()
            if period == "1mo":
                start_date = end_date - timedelta(days=30)
            elif period == "3mo":
                start_date = end_date - timedelta(days=90)
            elif period == "6mo":
                start_date = end_date - timedelta(days=180)
            elif period == "1y":
                start_date = end_date - timedelta(days=365)
            elif period == "2y":
                start_date = end_date - timedelta(days=365*2)
            else:  # 5y
                start_date = end_date - timedelta(days=365*5)
            
            # First try with Alpaca
            hist = None
            alpaca_error = None
            
            try:
                hist = api.get_bars(
                    symbol,
                    '1D',  # Daily bars
                    start=start_date.strftime('%Y-%m-%d'),
                    adjustment='raw'
                ).df
                
                # Rename columns to match yfinance format
                if not hist.empty:
                    hist = hist.rename(columns={
                        'open': 'Open',
                        'high': 'High',
                        'low': 'Low',
                        'close': 'Close',
                        'volume': 'Volume'
                    })
                    data_source = "Alpaca API"
            except Exception as api_error:
                alpaca_error = str(api_error)
                st.warning(f"Alpaca API error: {alpaca_error}. Falling back to Yahoo Finance...")
                
                # Fall back to yfinance if Alpaca fails
                try:
                    stock = yf.Ticker(symbol)
                    hist = stock.history(period=period)
                    data_source = "Yahoo Finance"
                except Exception as yf_error:
                    st.error(f"Also failed with Yahoo Finance: {str(yf_error)}")
                    return
            
            if hist is None or hist.empty:
                st.warning(f"No data available for {symbol}. The symbol might be delisted or incorrect.")
            else:
                # Store data in session state
                st.session_state.search_data = hist
                st.session_state.search_time = datetime.now()
                
                # Display basic stock info
                st.subheader(f"{symbol} Stock Analysis (Data Source: {data_source})")
                
                # Create price chart
                fig = go.Figure(data=[go.Candlestick(x=hist.index,
                    open=hist['Open'],
                    high=hist['High'],
                    low=hist['Low'],
                    close=hist['Close'])])
                
                fig.update_layout(
                    title=f"{symbol} Stock Price",
                    yaxis_title="Price",
                    xaxis_title="Date",
                    template="plotly_dark"
                )
                
                st.plotly_chart(fig, use_container_width=True)
                
                # Display key metrics
                col1, col2, col3 = st.columns(3)
                
                with col1:
                    st.metric("Current Price", f"${hist['Close'].iloc[-1]:.2f}")
                with col2:
                    if len(hist) > 1:
                        daily_return = ((hist['Close'].iloc[-1] - hist['Close'].iloc[-2])/hist['Close'].iloc[-2]) * 100
                        st.metric("Daily Return", f"{daily_return:.2f}%")
                    else:
                        st.metric("Daily Return", "N/A")
                with col3:
                    volume = hist['Volume'].iloc[-1]
                    st.metric("Volume", f"{volume:,.0f}")
                    
        except Exception as e:
            st.error("An unexpected error occurred.")
            st.error(f"Error details: {str(e)}")
            st.error("Stack trace:")
            st.code(traceback.format_exc())
    elif st.session_state.search_data is not None:
        # Display stored data
        hist = st.session_state.search_data
        
        # Display basic stock info
        st.subheader(f"{symbol} Stock Analysis")
        
        # Create price chart
        fig = go.Figure(data=[go.Candlestick(x=hist.index,
            open=hist['Open'],
            high=hist['High'],
            low=hist['Low'],
            close=hist['Close'])])
        
        fig.update_layout(
            title=f"{symbol} Stock Price",
            yaxis_title="Price",
            xaxis_title="Date",
            template="plotly_dark"
        )
        
        st.plotly_chart(fig, use_container_width=True)
        
        # Display key metrics
        col1, col2, col3 = st.columns(3)
        
        with col1:
            st.metric("Current Price", f"${hist['Close'].iloc[-1]:.2f}")
        with col2:
            if len(hist) > 1:
                daily_return = ((hist['Close'].iloc[-1] - hist['Close'].iloc[-2])/hist['Close'].iloc[-2]) * 100
                st.metric("Daily Return", f"{daily_return:.2f}%")
            else:
                st.metric("Daily Return", "N/A")
        with col3:
            volume = hist['Volume'].iloc[-1]
            st.metric("Volume", f"{volume:,.0f}")

def analyze_page():
    st.markdown("""
    # S&P 500 Analysis
    Analyze stocks for buy and sell signals based on technical indicators.
    """)
    
    # Add lookback period selector
    lookback_options = {
        "6 Months": "6M",
        "1 Year": "1Y",
        "5 Years": "5Y"
    }
    
    lookback = st.selectbox(
        "Select Lookback Period",
        options=list(lookback_options.keys()),
        index=0  # Default to 6 Months
    )

    # Add analyze button and last analysis time
    col1, col2 = st.columns([2,3])
    with col1:
        analyze_button = st.button("Analyze S&P 500")
    with col2:
        if st.session_state.last_analysis_time:
            st.text(f"Last analyzed: {st.session_state.last_analysis_time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    if analyze_button:
        with st.spinner("Analyzing stocks..."):
            results = []
            sell_signals = []
            portfolio_analysis = []
            buy_signals = []
            near_buy_signals_data = []
            
            # Progress bar
            progress_bar = st.progress(0)
            
            # Get start date based on selected lookback period
            start_date = get_start_date(lookback_options[lookback])
            
            # First, analyze portfolio stocks for sell signals
            if not st.session_state.portfolio.empty:
                portfolio_symbols = st.session_state.portfolio['Symbol'].unique()
                
                for symbol in portfolio_symbols:
                    try:
                        time.sleep(0.2)  # Rate limiting delay
                        
                        bars = api.get_bars(
                            symbol,
                            '1D',
                            start=start_date.strftime('%Y-%m-%d'),
                            adjustment='raw'
                        ).df
                        
                        if not bars.empty:
                            df = calculate_technical_indicators(bars)
                            df = calculate_enhanced_indicators(df)
                            
                            # Calculate sell score and conditions
                            sell_score, sell_conditions = calculate_sell_score(df)
                            
                            # Add to portfolio analysis
                            portfolio_analysis.append({
                                'Symbol': symbol,
                                'Current Price': df['close'].iloc[-1],
                                'RSI': df['RSI'].iloc[-1],
                                'RSI > 70': "✅" if df['RSI'].iloc[-1] > 70 else "❌",
                                'MACD Diff': df['MACD'].iloc[-1] - df['MACD_Signal'].iloc[-1],
                                'MACD Bearish': "✅" if (df['MACD'].iloc[-2] - df['MACD_Signal'].iloc[-2] > 0 and 
                                                      df['MACD'].iloc[-1] - df['MACD_Signal'].iloc[-1] < 0) else "❌",
                                'BB Distance': df['close'].iloc[-1] - df['BB_upper'].iloc[-1],
                                'Price > BB': "✅" if df['close'].iloc[-1] > df['BB_upper'].iloc[-1] else "❌",
                                'EMA Crossover': "✅" if (df['EMA_9'].iloc[-2] - df['EMA_21'].iloc[-2] > 0 and 
                                                      df['EMA_9'].iloc[-1] - df['EMA_21'].iloc[-1] < 0) else "❌",
                                'Volume Spike': "✅" if (df['close'].iloc[-1] < df['open'].iloc[-1] and 
                                                     df['volume'].iloc[-1] > df['Volume_MA20'].iloc[-1] * 1.5) else "❌",
                                'Stoch RSI': "✅" if (df['Stoch_RSI'].iloc[-1] > 0.8 and 
                                                  df['Stoch_RSI'].iloc[-1] < df['Stoch_RSI'].iloc[-2]) else "❌",
                                'OBV Trend': "✅" if (df['OBV'].iloc[-1] < df['OBV'].iloc[-2] < df['OBV'].iloc[-3]) else "❌",
                                'CCI > 100': "✅" if df['CCI'].iloc[-1] > 100 else "❌",
                                'Bearish Candle': "✅" if (df['close'].iloc[-1] < df['open'].iloc[-1] and 
                                                       df['close'].iloc[-1] < df['close'].iloc[-2]) else "❌",
                                'Sell Score': sell_score,
                                'Signal': "🔴 SELL" if sell_score >= 11 else "⏳ HOLD"
                            })
                            
                            # Add to sell signals if score is high enough
                            if sell_score >= 11:
                                sell_signals.append({
                                    'Symbol': symbol,
                                    'Current Price': df['close'].iloc[-1],
                                    'RSI': df['RSI'].iloc[-1],
                                    'MACD Diff': df['MACD'].iloc[-1] - df['MACD_Signal'].iloc[-1],
                                    'BB Distance': df['close'].iloc[-1] - df['BB_upper'].iloc[-1],
                                    'Sell Score': sell_score,
                                    'Conditions Met': len(sell_conditions)
                                })
                    
                    except Exception as e:
                        print(f"Error analyzing {symbol}: {str(e)}")
                        continue
            
            # Store sell signals and portfolio analysis
            st.session_state.sell_signals = pd.DataFrame(sell_signals) if sell_signals else None
            st.session_state.portfolio_analysis = pd.DataFrame(portfolio_analysis) if portfolio_analysis else None
            
            # Analyze all S&P 500 for buy signals
            symbols = get_sp500_symbols()
            
            for i, symbol in enumerate(symbols):
                try:
                    time.sleep(0.2)  # Rate limiting delay
                    
                    bars = api.get_bars(
                        symbol,
                        '1D',
                        start=start_date.strftime('%Y-%m-%d'),
                        adjustment='raw'
                    ).df
                    
                    if not bars.empty:
                        bars = calculate_technical_indicators(bars)
                        bars = calculate_enhanced_indicators(bars)
                        
                        # Calculate buy score and conditions
                        buy_score, buy_conditions = calculate_buy_score(bars)
                        
                        # Add to results with detailed conditions
                        results.append({
                            'Symbol': symbol,
                            'Current Price': bars['close'].iloc[-1],
                            'RSI': bars['RSI'].iloc[-1],
                            'RSI < 30': "✅" if bars['RSI'].iloc[-1] < 30 else "❌",
                            'MACD Diff': bars['MACD'].iloc[-1] - bars['MACD_Signal'].iloc[-1],
                            'MACD Bullish': "✅" if (bars['MACD'].iloc[-2] - bars['MACD_Signal'].iloc[-2] < 0 and 
                                                  bars['MACD'].iloc[-1] - bars['MACD_Signal'].iloc[-1] > 0) else "❌",
                            'BB Distance': bars['close'].iloc[-1] - bars['BB_lower'].iloc[-1],
                            'Price < BB': "✅" if bars['close'].iloc[-1] < bars['BB_lower'].iloc[-1] else "❌",
                            'EMA Crossover': "✅" if (bars['EMA_9'].iloc[-2] - bars['EMA_21'].iloc[-2] < 0 and 
                                                  bars['EMA_9'].iloc[-1] - bars['EMA_21'].iloc[-1] > 0) else "❌",
                            'High Volume': "✅" if bars['volume'].iloc[-1] > bars['Volume_MA20'].iloc[-1] * 1.5 else "❌",
                            'Stoch RSI': "✅" if (bars['Stoch_RSI'].iloc[-1] < 0.2 and 
                                              bars['Stoch_RSI'].iloc[-1] > bars['Stoch_RSI'].iloc[-2]) else "❌",
                            'OBV Trend': "✅" if (bars['OBV'].iloc[-1] > bars['OBV'].iloc[-2] > bars['OBV'].iloc[-3]) else "❌",
                            'CCI < -100': "✅" if bars['CCI'].iloc[-1] < -100 else "❌",
                            'ATR Increasing': "✅" if bars['ATR'].iloc[-1] > bars['ATR'].iloc[-2] else "❌",
                            'Bullish Candle': "✅" if (bars['close'].iloc[-1] > bars['open'].iloc[-1] and 
                                                   bars['close'].iloc[-1] > bars['close'].iloc[-2]) else "❌",
                            'Buy Score': buy_score,
                            'Signal': "🎯 BUY" if buy_score >= 13 else "⏳ HOLD"
                        })
                        
                        # Add to buy signals if score is high enough
                        if buy_score >= 13:
                            buy_signals.append({
                                'Symbol': symbol,
                                'Current Price': bars['close'].iloc[-1],
                                'RSI': bars['RSI'].iloc[-1],
                                'MACD Diff': bars['MACD'].iloc[-1] - bars['MACD_Signal'].iloc[-1],
                                'BB Distance': bars['close'].iloc[-1] - bars['BB_lower'].iloc[-1],
                                'Buy Score': buy_score,
                                'Conditions Met': len(buy_conditions)
                            })
                
                except Exception as e:
                    st.warning(f"Could not fetch data for {symbol}: {str(e)}")
                
                progress_bar.progress((i + 1) / len(symbols))

            # Store results in session state
            if results:
                df = pd.DataFrame(results)
                st.session_state.sp500_data = df.sort_values('Buy Score', ascending=False)
                st.session_state.buy_signals = pd.DataFrame(buy_signals) if buy_signals else None
                st.session_state.last_analysis_time = datetime.now()

    # Display results in organized sections
    if st.session_state.sp500_data is not None:
        # 1. All S&P 500 Stocks
        st.subheader("All S&P 500 Stocks")
        st.dataframe(st.session_state.sp500_data)
        
        # Download button for all stocks
        csv = st.session_state.sp500_data.to_csv(index=False)
        st.download_button(
            label="Download Data as CSV",
            data=csv,
            file_name="sp500_analysis.csv",
            mime="text/csv",
            key="download_all_stocks"
        )
        
        # 2. Buy Signals
        st.subheader("🎯 Buy Signals - Stocks with Score ≥ 13")
        if st.session_state.buy_signals is not None and not st.session_state.buy_signals.empty:
            st.dataframe(st.session_state.buy_signals)
            
            # Download button for buy signals
            buy_csv = st.session_state.buy_signals.to_csv(index=False)
            st.download_button(
                label="Download Buy Signals",
                data=buy_csv,
                file_name="sp500_buy_signals.csv",
                mime="text/csv",
                key="download_buy_signals"
            )
        else:
            st.info("No stocks currently meet the buy signal criteria (score ≥ 13).")
        
        # 3. Sell Signals
        st.subheader("🔴 Sell Signals - Portfolio Positions with Score ≥ 11")
        if not st.session_state.portfolio.empty:
            if st.session_state.portfolio_analysis is not None and not st.session_state.portfolio_analysis.empty:
                st.dataframe(st.session_state.portfolio_analysis)
                
                # Download button for portfolio analysis
                portfolio_csv = st.session_state.portfolio_analysis.to_csv(index=False)
                st.download_button(
                    label="Download Portfolio Analysis",
                    data=portfolio_csv,
                    file_name="portfolio_analysis.csv",
                    mime="text/csv",
                    key="download_portfolio_analysis"
                )
                
                # Also display specific sell signals if any
                if st.session_state.sell_signals is not None and not st.session_state.sell_signals.empty:
                    st.subheader("🔴 Stocks Meeting Sell Criteria (Score ≥ 11)")
                    st.dataframe(st.session_state.sell_signals)
                    
                    # Download button for sell signals
                    sell_csv = st.session_state.sell_signals.to_csv(index=False)
                    st.download_button(
                        label="Download Sell Signals",
                        data=sell_csv,
                        file_name="sell_signals.csv",
                        mime="text/csv",
                        key="download_sell_signals"
                    )
            else:
                st.info("No portfolio analysis available. Run the analysis to evaluate your positions.")
        else:
            st.info("No positions in portfolio to analyze. Add stocks to your portfolio first.")

def definitions_page():
    st.markdown("""
    # Technical Analysis Definitions
    
    This page explains the technical indicators used in our analysis and their calculations.
    
    ## 🎯 Signal Criteria
    
    ### Buy Signals (20-point scale)
    A stock generates a buy signal when it achieves a score of 13 or higher:
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
    A stock generates a sell signal when it achieves a score of 11 or higher:
    1. RSI > 70 (3 points)
    2. MACD Bearish Crossover (3 points)
    3. Price above BB (2 points)
    4. EMA 9/21 Bearish Crossover (2 points)
    5. Volume Spike on Down Candle (2 points)
    6. Stochastic RSI > 80 & Falling (1 point)
    7. OBV Falling (1 point)
    8. CCI > 100 (1 point)
    9. Bearish Candlestick (2 points)
    
    ## 📊 Technical Indicators
    
    ### 1. RSI (Relative Strength Index)
    RSI measures the magnitude of recent price changes to evaluate overbought or oversold conditions.
    
    **Parameters:**
    - Lookback period: 14 days
    - Oversold threshold: 30 (Buy signal)
    - Overbought threshold: 70 (Sell signal)
    
    **Formula:**
    ```
    RSI = 100 - (100 / (1 + RS))
    where:
    RS = (Average Gain over 14 days) / (Average Loss over 14 days)
    ```
    
    ### 2. MACD (Moving Average Convergence Divergence)
    MACD shows the relationship between two moving averages of a price.
    
    **Parameters:**
    - Fast EMA: 12 days
    - Slow EMA: 26 days
    - Signal Line: 9-day EMA of MACD
    
    **Formula:**
    ```
    MACD Line = 12-day EMA - 26-day EMA
    Signal Line = 9-day EMA of MACD Line
    ```
    
    ### 3. Bollinger Bands
    Bollinger Bands measure volatility and show relative price levels.
    
    **Parameters:**
    - Middle Band: 20-day Simple Moving Average (SMA)
    - Upper/Lower Bands: 2 standard deviations from SMA
    
    **Formula:**
    ```
    Middle Band = 20-day SMA
    Upper Band = Middle Band + (2 × Standard Deviation)
    Lower Band = Middle Band - (2 × Standard Deviation)
    ```
    
    ### 4. EMA (Exponential Moving Average)
    EMA gives more weight to recent prices.
    
    **Parameters:**
    - EMA 9: 9-day exponential moving average
    - EMA 21: 21-day exponential moving average
    
    **Formula:**
    ```
    EMA = Price × (2 ÷ (n + 1)) + EMA[previous] × (1 - (2 ÷ (n + 1)))
    where n = number of days
    ```
    
    ### 5. Stochastic RSI
    Combines Stochastic oscillator with RSI to identify overbought/oversold conditions.
    
    **Parameters:**
    - Period: 14 days
    - Smoothing: 3 days
    
    **Formula:**
    ```
    StochRSI = (RSI - RSI_min) / (RSI_max - RSI_min)
    where:
    RSI_min = minimum RSI over period
    RSI_max = maximum RSI over period
    ```
    
    ### 6. OBV (On Balance Volume)
    OBV measures buying and selling pressure by adding/subtracting volume based on price movement.
    
    **Formula:**
    ```
    If Close > Previous Close:
        OBV = Previous OBV + Volume
    If Close < Previous Close:
        OBV = Previous OBV - Volume
    ```
    
    ### 7. CCI (Commodity Channel Index)
    CCI measures the current price level relative to an average price level.
    
    **Parameters:**
    - Period: 20 days
    - Constant: 0.015
    
    **Formula:**
    ```
    CCI = (Typical Price - SMA) / (0.015 × Mean Deviation)
    where:
    Typical Price = (High + Low + Close) / 3
    ```
    
    ### 8. ATR (Average True Range)
    ATR measures market volatility by decomposing the entire range of an asset price.
    
    **Parameters:**
    - Period: 14 days
    
    **Formula:**
    ```
    True Range = max(High - Low, |High - Previous Close|, |Low - Previous Close|)
    ATR = 14-day SMA of True Range
    ```
    
    ## 📈 Analysis Process
    
    1. **Data Collection:**
       - Fetches daily price data based on selected lookback period
       - Available periods: 6 Months, 1 Year, 5 Years
    
    2. **Portfolio Analysis:**
       - Checks current portfolio positions for sell signals
       - Requires score of 11 or higher to trigger sell signal
    
    3. **S&P 500 Analysis:**
       - Analyzes all S&P 500 stocks for buy signals
       - Requires score of 13 or higher to trigger buy signal
    
    4. **Results Display:**
       - Shows detailed analysis for each stock
       - Displays current values for all indicators
       - Highlights which conditions are met (✅) or not met (❌)
       - Separate tables for buy and sell signals
    """)

def portfolio_page():
    st.markdown("""
    # Portfolio Management
    Track your stock purchases and sales, monitor performance, and analyze your trading history.
    """)
    
    # Create tabs for different sections
    buy_tab, sell_tab, portfolio_tab, history_tab = st.tabs(["Log Buy", "Log Sell", "Current Portfolio", "Transaction History"])
    
    with buy_tab:
        st.subheader("Log Buy Transaction")
        
        # Buy form
        with st.form("buy_form"):
            buy_symbol = st.text_input("Stock Symbol").upper()
            buy_shares = st.number_input("Number of Shares", min_value=0.00001, step=0.00001, format="%.5f")
            buy_price = st.number_input("Purchase Price per Share", min_value=0.01, step=0.01)
            buy_date = st.date_input("Purchase Date", max_value=datetime.now().date())
            
            submit_buy = st.form_submit_button("Log Buy")
            
            if submit_buy and buy_symbol and buy_shares and buy_price:
                try:
                    # Get current data and calculate signals
                    bars = api.get_bars(
                        buy_symbol,
                        '1D',
                        start=(buy_date - timedelta(days=30)).strftime('%Y-%m-%d'),
                        end=buy_date.strftime('%Y-%m-%d'),
                        adjustment='raw'
                    ).df
                    
                    if not bars.empty:
                        # Calculate indicators and score
                        bars = calculate_technical_indicators(bars)
                        bars = calculate_enhanced_indicators(bars)
                        _, buy_score, buy_conditions = calculate_buy_score(bars)
                        
                        # Create unique ID for the transaction
                        transaction_id = str(uuid.uuid4())
                        
                        # Add to portfolio
                        new_position = pd.DataFrame({
                            'ID': [transaction_id],
                            'Symbol': [buy_symbol],
                            'Shares': [buy_shares],
                            'Buy Price': [buy_price],
                            'Buy Date': [buy_date],
                            'Total Cost': [buy_shares * buy_price],
                            'Buy Score': [buy_score],
                            'Buy Conditions': [json.dumps(buy_conditions)]
                        })
                        
                        st.session_state.portfolio = pd.concat([st.session_state.portfolio, new_position], ignore_index=True)
                        save_portfolio_data(st.session_state.portfolio, st.session_state.transactions)
                        st.success(f"Successfully logged purchase of {buy_shares} shares of {buy_symbol} at ${buy_price:.2f}")
                        st.info(f"Buy Signal Score: {buy_score}/20")
                        st.info("Conditions Met:")
                        for condition in buy_conditions:
                            st.write(f"✅ {condition}")
                    else:
                        st.error(f"No data available for {buy_symbol} on {buy_date}")
                except Exception as e:
                    st.error(f"Error processing buy transaction: {str(e)}")
    
    with sell_tab:
        st.subheader("Log Sell Transaction")
        
        if st.session_state.portfolio.empty:
            st.warning("No positions in portfolio to sell.")
        else:
            # Get unique positions from portfolio
            positions = st.session_state.portfolio[['ID', 'Symbol', 'Shares', 'Buy Price', 'Buy Date']].to_dict('records')
            
            # Create selection box for positions
            position_labels = [f"{p['Symbol']} - {p['Shares']} shares @ ${p['Buy Price']:.2f} (ID: {p['ID'][:8]})" for p in positions]
            selected_position = st.selectbox("Select Position to Sell", position_labels)
            
            if selected_position:
                position_idx = position_labels.index(selected_position)
                position = positions[position_idx]
                
                with st.form("sell_form"):
                    sell_price = st.number_input("Sell Price per Share", min_value=0.01, step=0.01)
                    sell_date = st.date_input("Sell Date", min_value=datetime.strptime(position['Buy Date'], '%Y-%m-%d').date() if isinstance(position['Buy Date'], str) else position['Buy Date'], max_value=datetime.now().date())
                    
                    submit_sell = st.form_submit_button("Log Sell")
                    
                    if submit_sell:
                        try:
                            # Get current data and calculate signals
                            bars = api.get_bars(
                                position['Symbol'],
                                '1D',
                                start=(sell_date - timedelta(days=30)).strftime('%Y-%m-%d'),
                                end=sell_date.strftime('%Y-%m-%d'),
                                adjustment='raw'
                            ).df
                            
                            if not bars.empty:
                                # Calculate indicators and score
                                bars = calculate_technical_indicators(bars)
                                bars = calculate_enhanced_indicators(bars)
                                _, sell_score, sell_conditions = calculate_sell_score(bars)
                                
                                # Calculate profit/loss
                                profit = (sell_price - position['Buy Price']) * position['Shares']
                                return_pct = ((sell_price - position['Buy Price']) / position['Buy Price']) * 100
                                
                                # Get buy score and conditions from portfolio
                                buy_score = st.session_state.portfolio.loc[st.session_state.portfolio['ID'] == position['ID'], 'Buy Score'].iloc[0]
                                buy_conditions = json.loads(st.session_state.portfolio.loc[st.session_state.portfolio['ID'] == position['ID'], 'Buy Conditions'].iloc[0])
                                
                                # Add to transactions history
                                new_transaction = pd.DataFrame({
                                    'ID': [position['ID']],
                                    'Symbol': [position['Symbol']],
                                    'Shares': [position['Shares']],
                                    'Buy Price': [position['Buy Price']],
                                    'Sell Price': [sell_price],
                                    'Buy Date': [position['Buy Date']],
                                    'Sell Date': [sell_date],
                                    'Profit/Loss': [profit],
                                    'Return %': [return_pct],
                                    'Buy Score': [buy_score],
                                    'Sell Score': [sell_score],
                                    'Buy Conditions': [json.dumps(buy_conditions)],
                                    'Sell Conditions': [json.dumps(sell_conditions)]
                                })
                                
                                st.session_state.transactions = pd.concat([st.session_state.transactions, new_transaction], ignore_index=True)
                                
                                # Update portfolio (remove sold position)
                                st.session_state.portfolio = st.session_state.portfolio[st.session_state.portfolio['ID'] != position['ID']]
                                
                                # Update statistics
                                st.session_state.total_profit += profit
                                st.session_state.total_trades += 1
                                if profit > 0:
                                    st.session_state.win_count += 1
                                
                                # Save updated data
                                save_portfolio_data(st.session_state.portfolio, st.session_state.transactions)
                                
                                st.success(f"Successfully logged sale of {position['Shares']} shares of {position['Symbol']} for ${sell_price:.2f}")
                                st.info(f"Buy Signal Score: {buy_score}/20")
                                st.info(f"Sell Signal Score: {sell_score}/17")
                                st.info("Buy Conditions Met:")
                                for condition in buy_conditions:
                                    st.write(f"✅ {condition}")
                                st.info("Sell Conditions Met:")
                                for condition in sell_conditions:
                                    st.write(f"✅ {condition}")
                            else:
                                st.error(f"No data available for {position['Symbol']} on {sell_date}")
                        except Exception as e:
                            st.error(f"Error processing sell transaction: {str(e)}")

    with portfolio_tab:
        st.subheader("Current Portfolio")
        
        # Display portfolio statistics
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            win_rate = (st.session_state.win_count / st.session_state.total_trades * 100) if st.session_state.total_trades > 0 else 0
            st.metric("Win Rate", f"{win_rate:.1f}%")
        
        with col2:
            st.metric("Total Profit/Loss", f"${st.session_state.total_profit:.2f}")
        
        with col3:
            st.metric("Total Trades", st.session_state.total_trades)
            
        with col4:
            # Calculate average return including both current portfolio and transaction history
            total_investment = 0
            total_current_value = 0
            
            # Add current portfolio positions
            if not st.session_state.portfolio.empty:
                total_investment += st.session_state.portfolio['Total Cost'].sum()
                current_values = []
                for _, position in st.session_state.portfolio.iterrows():
                    try:
                        # Add delay to avoid rate limiting
                        time.sleep(0.2)  # 200ms delay between API calls
                        
                        # Get current price from Alpaca
                        bars = api.get_bars(
                            position['Symbol'],
                            '1D',
                            limit=1,
                            adjustment='raw'
                        ).df
                        current_price = bars['close'].iloc[-1]
                        current_value = current_price * position['Shares']
                        current_values.append(current_value)
                    except Exception as e:
                        st.warning(f"Could not fetch current price for {position['Symbol']}: {str(e)}")
                        continue
                
                if current_values:
                    total_current_value += sum(current_values)
            
            # Add historical transactions
            if not st.session_state.transactions.empty:
                # Add investment amount from historical transactions
                total_investment += st.session_state.transactions['Buy Price'].multiply(st.session_state.transactions['Shares']).sum()
                # Add realized value from historical transactions
                total_current_value += st.session_state.transactions['Sell Price'].multiply(st.session_state.transactions['Shares']).sum()
            
            # Calculate overall average return
            if total_investment > 0:
                avg_return = ((total_current_value - total_investment) / total_investment) * 100
                st.metric("Average Return", f"{avg_return:.2f}%")
            else:
                st.metric("Average Return", "N/A")
        
        # Display current portfolio
        if not st.session_state.portfolio.empty:
            # Add current value and return columns to the display
            display_portfolio = st.session_state.portfolio.copy()
            current_values = []
            returns = []
            
            for _, position in display_portfolio.iterrows():
                try:
                    # Add delay to avoid rate limiting
                    time.sleep(0.2)  # 200ms delay between API calls
                    
                    # Get current price from Alpaca
                    bars = api.get_bars(
                        position['Symbol'],
                        '1D',
                        limit=1,
                        adjustment='raw'
                    ).df
                    current_price = bars['close'].iloc[-1]
                    current_value = current_price * position['Shares']
                    position_return = ((current_price - position['Buy Price']) / position['Buy Price']) * 100
                    
                    current_values.append(current_value)
                    returns.append(position_return)
                except Exception as e:
                    current_values.append(None)
                    returns.append(None)
            
            display_portfolio['Current Value'] = current_values
            display_portfolio['Return %'] = returns
            
            # Format the display
            display_portfolio['Buy Price'] = display_portfolio['Buy Price'].map('${:.2f}'.format)
            display_portfolio['Total Cost'] = display_portfolio['Total Cost'].map('${:.2f}'.format)
            
            # Only format Buy Score if the column exists
            if 'Buy Score' in display_portfolio.columns:
                display_portfolio['Buy Score'] = display_portfolio['Buy Score'].map(lambda x: f"{x}/20")
            
            # Display the portfolio
            st.dataframe(display_portfolio)
            
            # Add signal analysis section
            st.subheader("Signal Analysis")
            
            # Calculate average buy score if the column exists
            if 'Buy Score' in display_portfolio.columns:
                avg_buy_score = display_portfolio['Buy Score'].str.split('/').str[0].astype(float).mean()
                st.metric("Average Buy Signal Score", f"{avg_buy_score:.1f}/20")
                
                # Display conditions met for each position
                for _, position in display_portfolio.iterrows():
                    with st.expander(f"{position['Symbol']} - Buy Conditions"):
                        conditions = json.loads(position['Buy Conditions'])
                        for condition in conditions:
                            st.write(f"✅ {condition}")
        else:
            st.info("No positions in portfolio.")
    
    with history_tab:
        st.subheader("Transaction History")
        
        if not st.session_state.transactions.empty:
            # Format the display
            display_transactions = st.session_state.transactions.copy()
            display_transactions['Buy Price'] = display_transactions['Buy Price'].map('${:.2f}'.format)
            display_transactions['Sell Price'] = display_transactions['Sell Price'].map('${:.2f}'.format)
            display_transactions['Profit/Loss'] = display_transactions['Profit/Loss'].map('${:.2f}'.format)
            display_transactions['Return %'] = display_transactions['Return %'].map('{:.2f}%'.format)
            
            # Only format scores if the columns exist
            if 'Buy Score' in display_transactions.columns:
                display_transactions['Buy Score'] = display_transactions['Buy Score'].map(lambda x: f"{x}/20")
            if 'Sell Score' in display_transactions.columns:
                display_transactions['Sell Score'] = display_transactions['Sell Score'].map(lambda x: f"{x}/17")
            
            st.dataframe(display_transactions)
            
            # Add signal analysis section
            st.subheader("Signal Analysis")
            
            # Calculate average scores if the columns exist
            if 'Buy Score' in display_transactions.columns and 'Sell Score' in display_transactions.columns:
                avg_buy_score = display_transactions['Buy Score'].str.split('/').str[0].astype(float).mean()
                avg_sell_score = display_transactions['Sell Score'].str.split('/').str[0].astype(float).mean()
                
                col1, col2 = st.columns(2)
                with col1:
                    st.metric("Average Buy Signal Score", f"{avg_buy_score:.1f}/20")
                with col2:
                    st.metric("Average Sell Signal Score", f"{avg_sell_score:.1f}/17")
                
                # Display conditions for each transaction
                for _, transaction in display_transactions.iterrows():
                    with st.expander(f"{transaction['Symbol']} - Signal Details"):
                        col1, col2 = st.columns(2)
                        with col1:
                            st.write("Buy Conditions:")
                            buy_conditions = json.loads(transaction['Buy Conditions'])
                            for condition in buy_conditions:
                                st.write(f"✅ {condition}")
                        with col2:
                            st.write("Sell Conditions:")
                            sell_conditions = json.loads(transaction['Sell Conditions'])
                            for condition in sell_conditions:
                                st.write(f"✅ {condition}")
            
            # Download button for transaction history
            csv = st.session_state.transactions.to_csv(index=False)
            st.download_button(
                label="Download Transaction History",
                data=csv,
                file_name="transaction_history.csv",
                mime="text/csv",
                key="download_transaction_history"
            )
        else:
            st.info("No completed transactions yet.")

# Display the selected page
if page == "Search":
    search_page()
elif page == "Analyze":
    analyze_page()
elif page == "Portfolio":
    portfolio_page()
else:
    definitions_page() 
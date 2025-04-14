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
                    columns=['ID', 'Symbol', 'Shares', 'Buy Price', 'Buy Date', 'Total Cost'])
        else:
            portfolio_df = pd.DataFrame(columns=['ID', 'Symbol', 'Shares', 'Buy Price', 'Buy Date', 'Total Cost'])
        
        if TRANSACTIONS_FILE.exists():
            with open(TRANSACTIONS_FILE, 'r') as f:
                transactions_data = json.load(f)
                transactions_df = pd.DataFrame(transactions_data) if transactions_data else pd.DataFrame(
                    columns=['ID', 'Symbol', 'Shares', 'Buy Price', 'Sell Price', 'Buy Date', 'Sell Date', 'Profit/Loss', 'Return %'])
        else:
            transactions_df = pd.DataFrame(columns=['ID', 'Symbol', 'Shares', 'Buy Price', 'Sell Price', 'Buy Date', 'Sell Date', 'Profit/Loss', 'Return %'])
        
        # Calculate statistics
        total_profit = transactions_df['Profit/Loss'].sum() if not transactions_df.empty else 0.0
        total_trades = len(transactions_df)
        win_count = len(transactions_df[transactions_df['Profit/Loss'] > 0])
        
        return portfolio_df, transactions_df, total_profit, total_trades, win_count
    
    except Exception as e:
        st.error(f"Error loading portfolio data: {str(e)}")
        return (pd.DataFrame(columns=['ID', 'Symbol', 'Shares', 'Buy Price', 'Buy Date', 'Total Cost']),
                pd.DataFrame(columns=['ID', 'Symbol', 'Shares', 'Buy Price', 'Sell Price', 'Buy Date', 'Sell Date', 'Profit/Loss', 'Return %']),
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

def check_buy_conditions(df, symbol):
    if len(df) < 2:  # Need at least 2 data points for MACD crossover
        print(f"\n{symbol}: Insufficient data points (need at least 2, got {len(df)})")
        return False
    
    # Get date range info
    start_date = df.index[0].strftime('%Y-%m-%d')
    end_date = df.index[-1].strftime('%Y-%m-%d')
    total_days = len(df)
        
    # Check RSI < 30 (Oversold)
    rsi_condition = df['RSI'].iloc[-1] < 30
    
    # Check MACD bullish crossover (MACD line crosses above signal line)
    macd_prev = df['MACD'].iloc[-2] - df['MACD_Signal'].iloc[-2]
    macd_curr = df['MACD'].iloc[-1] - df['MACD_Signal'].iloc[-1]
    macd_condition = macd_prev < 0 and macd_curr > 0
    
    # Check if price is below lower Bollinger Band
    bb_condition = df['close'].iloc[-1] < df['BB_lower'].iloc[-1]
    
    # Count conditions met
    conditions_met = sum([rsi_condition, macd_condition, bb_condition])
    
    # Print detailed analysis
    print(f"\n{'='*50}")
    print(f"Analysis Report for {symbol}")
    print(f"{'='*50}")
    print(f"Date Range: {start_date} to {end_date} ({total_days} trading days)")
    
    print(f"\nPrice Information:")
    print(f"Current Price: ${df['close'].iloc[-1]:.2f}")
    print(f"Previous Close: ${df['close'].iloc[-2]:.2f}")
    print(f"Period Change: {((df['close'].iloc[-1] - df['close'].iloc[0]) / df['close'].iloc[0] * 100):.2f}%")
    
    print(f"\nBuy Conditions ({conditions_met}/3):")
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
    
    print(f"\nFinal Result: {'🎯 BUY SIGNAL' if (rsi_condition and macd_condition and bb_condition) else '⏳ NO SIGNAL'}")
    print(f"{'='*50}\n")
    
    return rsi_condition and macd_condition and bb_condition

def check_sell_conditions(df, symbol):
    """Check if a stock meets the sell conditions."""
    if len(df) < 2:  # Need at least 2 data points for MACD crossover
        print(f"\n{symbol}: Insufficient data points (need at least 2, got {len(df)})")
        return False
    
    # Get date range info
    start_date = df.index[0].strftime('%Y-%m-%d')
    end_date = df.index[-1].strftime('%Y-%m-%d')
    total_days = len(df)
        
    # Check RSI > 70 (Overbought)
    rsi_condition = df['RSI'].iloc[-1] > 70
    
    # Check MACD bearish crossover (MACD line crosses below signal line)
    macd_prev = df['MACD'].iloc[-2] - df['MACD_Signal'].iloc[-2]
    macd_curr = df['MACD'].iloc[-1] - df['MACD_Signal'].iloc[-1]
    macd_condition = macd_prev > 0 and macd_curr < 0
    
    # Check if price is above upper Bollinger Band
    bb_condition = df['close'].iloc[-1] > df['BB_upper'].iloc[-1]
    
    # Count conditions met (need 2 out of 3)
    conditions_met = sum([rsi_condition, macd_condition, bb_condition])
    
    # Print detailed analysis
    print(f"\n{'='*50}")
    print(f"Sell Analysis Report for {symbol}")
    print(f"{'='*50}")
    print(f"Date Range: {start_date} to {end_date} ({total_days} trading days)")
    
    print(f"\nPrice Information:")
    print(f"Current Price: ${df['close'].iloc[-1]:.2f}")
    print(f"Previous Close: ${df['close'].iloc[-2]:.2f}")
    print(f"Period Change: {((df['close'].iloc[-1] - df['close'].iloc[0]) / df['close'].iloc[0] * 100):.2f}%")
    
    print(f"\nSell Conditions ({conditions_met}/3, need 2/3):")
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
    
    print(f"\nFinal Result: {'🔴 SELL SIGNAL' if conditions_met >= 2 else '⏳ NO SIGNAL'}")
    print(f"{'='*50}\n")
    
    return conditions_met >= 2

def search_page():
    st.markdown("""
    Search and analyze individual stocks using Yahoo Finance data.
    """)
    
    # Search inputs with session state
    symbol = st.text_input("Enter Stock Symbol", value=st.session_state.search_symbol).upper()
    period = st.selectbox(
        "Select Time Period",
        options=["1mo", "3mo", "6mo", "1y", "2y", "5y"],
        index=["1mo", "3mo", "6mo", "1y", "2y", "5y"].index(st.session_state.search_period)
    )

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
            # Fetch stock data from Yahoo Finance
            stock = yf.Ticker(symbol)
            hist = stock.history(period=period)
            
            if hist.empty:
                st.warning(f"No data available for {symbol}. The symbol might be delisted or incorrect.")
            else:
                # Store data in session state
                st.session_state.search_data = hist
                st.session_state.search_time = datetime.now()
                
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
                    st.metric("Current Price", f"${hist['Close'][-1]:.2f}")
                with col2:
                    daily_return = ((hist['Close'][-1] - hist['Close'][-2])/hist['Close'][-2]) * 100
                    st.metric("Daily Return", f"{daily_return:.2f}%")
                with col3:
                    volume = hist['Volume'][-1]
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
            st.metric("Current Price", f"${hist['Close'][-1]:.2f}")
        with col2:
            daily_return = ((hist['Close'][-1] - hist['Close'][-2])/hist['Close'][-2]) * 100
            st.metric("Daily Return", f"{daily_return:.2f}%")
        with col3:
            volume = hist['Volume'][-1]
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
            portfolio_analysis = []  # New list to store all portfolio stock analysis
            buy_signals = []
            
            # Progress bar
            progress_bar = st.progress(0)
            
            # Get start date based on selected lookback period
            start_date = get_start_date(lookback_options[lookback])
            
            # First, analyze portfolio stocks for sell signals
            if not st.session_state.portfolio.empty:
                portfolio_symbols = st.session_state.portfolio['Symbol'].unique()
                
                print("\n\n" + "="*80)
                print("ANALYZING PORTFOLIO POSITIONS FOR SELL SIGNALS")
                print("="*80 + "\n")
                
                for symbol in portfolio_symbols:
                    try:
                        # Use the same start_date as defined above instead of recalculating
                        bars = api.get_bars(
                            symbol,
                            '1D',
                            start=start_date.strftime('%Y-%m-%d'),
                            adjustment='raw'
                        ).df
                        
                        if not bars.empty:
                            df = calculate_technical_indicators(bars)
                            
                            # Calculate conditions
                            rsi_condition = df['RSI'].iloc[-1] > 70
                            macd_prev = df['MACD'].iloc[-2] - df['MACD_Signal'].iloc[-2]
                            macd_curr = df['MACD'].iloc[-1] - df['MACD_Signal'].iloc[-1]
                            macd_condition = macd_prev > 0 and macd_curr < 0
                            bb_condition = df['close'].iloc[-1] > df['BB_upper'].iloc[-1]
                            conditions_met = sum([rsi_condition, macd_condition, bb_condition])
                            
                            # Add to portfolio analysis regardless of sell conditions
                            portfolio_analysis.append({
                                'Symbol': symbol,
                                'Current Price': df['close'].iloc[-1],
                                'RSI': df['RSI'].iloc[-1],
                                'RSI Condition': "✅" if rsi_condition else "❌",
                                'MACD Diff': df['MACD'].iloc[-1] - df['MACD_Signal'].iloc[-1],
                                'MACD Crossover': "✅" if macd_condition else "❌",
                                'BB Distance': df['close'].iloc[-1] - df['BB_upper'].iloc[-1],
                                'BB Condition': "✅" if bb_condition else "❌",
                                'Conditions Met': f"{conditions_met}/3",
                                'Sell Signal': "🔴 SELL" if conditions_met >= 2 else "⏳ HOLD"
                            })
                            
                            # Still add to sell signals if criteria met
                            if check_sell_conditions(df, symbol):
                                sell_signals.append({
                                    'Symbol': symbol,
                                    'Current Price': df['close'].iloc[-1],
                                    'RSI': df['RSI'].iloc[-1],
                                    'MACD Diff': df['MACD'].iloc[-1] - df['MACD_Signal'].iloc[-1],
                                    'BB Distance': df['close'].iloc[-1] - df['BB_upper'].iloc[-1]
                                })
                    
                    except Exception as e:
                        print(f"Error analyzing {symbol}: {str(e)}")
                        continue
            
            # Store sell signals and portfolio analysis in session state
            st.session_state.sell_signals = pd.DataFrame(sell_signals) if sell_signals else None
            st.session_state.portfolio_analysis = pd.DataFrame(portfolio_analysis) if portfolio_analysis else None
            
            # Then analyze all S&P 500 for buy signals
            print("\n\n" + "="*80)
            print("ANALYZING S&P 500 STOCKS FOR BUY SIGNALS")
            print("="*80 + "\n")
            
            symbols = get_sp500_symbols()
            
            for i, symbol in enumerate(symbols):
                try:
                    # Get daily bars
                    bars = api.get_bars(
                        symbol,
                        '1D',
                        start=start_date.strftime('%Y-%m-%d'),
                        adjustment='raw'
                    ).df
                    
                    if not bars.empty:
                        # Calculate technical indicators
                        bars = calculate_technical_indicators(bars)
                        
                        last_price = bars['close'].iloc[-1]
                        daily_change = ((bars['close'].iloc[-1] - bars['open'].iloc[-1]) / bars['open'].iloc[-1]) * 100
                        volume = bars['volume'].iloc[-1]
                        period_change = ((bars['close'].iloc[-1] - bars['close'].iloc[0]) / bars['close'].iloc[0]) * 100
                        
                        # Only print analysis if conditions are close to being met
                        rsi = bars['RSI'].iloc[-1]
                        macd_diff = bars['MACD'].iloc[-1] - bars['MACD_Signal'].iloc[-1]
                        price_vs_bb = bars['close'].iloc[-1] - bars['BB_lower'].iloc[-1]
                        
                        # Check if worth printing (close to buy conditions)
                        if (rsi < 35 or  # RSI close to oversold
                            (abs(macd_diff) < 0.5) or  # MACD close to crossover
                            (abs(price_vs_bb) < bars['close'].iloc[-1] * 0.02)):  # Price close to BB
                            
                            # Check buy conditions and print analysis
                            if check_buy_conditions(bars, symbol):
                                buy_signals.append({
                                    'Symbol': symbol,
                                    'Price': last_price,
                                    'RSI': bars['RSI'].iloc[-1],
                                    'MACD': bars['MACD'].iloc[-1],
                                    'MACD_Signal': bars['MACD_Signal'].iloc[-1],
                                    'BB_Lower': bars['BB_lower'].iloc[-1]
                                })
                        
                        results.append({
                            'Symbol': symbol,
                            'Price': last_price,
                            'Daily Change %': daily_change,
                            f'{lookback} Change %': period_change,
                            'Volume': volume,
                            'RSI': bars['RSI'].iloc[-1]
                        })
                
                except Exception as e:
                    st.warning(f"Could not fetch data for {symbol}: {str(e)}")
                
                # Update progress
                progress_bar.progress((i + 1) / len(symbols))

            print("\n\n" + "="*80)
            print("ANALYSIS COMPLETE")
            print("="*80 + "\n")

            # Store results in session state
            if results:
                df = pd.DataFrame(results)
                st.session_state.sp500_data = df.sort_values('Daily Change %', ascending=False)
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
            mime="text/csv"
        )
        
        # 2. Buy Signals
        st.subheader("🎯 Buy Signals - Stocks Meeting All Conditions")
        if st.session_state.buy_signals is not None and not st.session_state.buy_signals.empty:
            st.dataframe(st.session_state.buy_signals)
            
            # Download button for buy signals
            buy_csv = st.session_state.buy_signals.to_csv(index=False)
            st.download_button(
                label="Download Buy Signals",
                data=buy_csv,
                file_name="sp500_buy_signals.csv",
                mime="text/csv",
                key="buy_signals"
            )
        else:
            st.info("No stocks currently meet all buy conditions.")
        
        # 3. Sell Signals
        st.subheader("💰 Sell Signals - Portfolio Positions")
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
                    st.subheader("🔴 Stocks Meeting Sell Criteria")
                    st.dataframe(st.session_state.sell_signals)
                    
                    # Download button for sell signals
                    sell_csv = st.session_state.sell_signals.to_csv(index=False)
                    st.download_button(
                        label="Download Sell Signals",
                        data=sell_csv,
                        file_name="sell_signals.csv",
                        mime="text/csv",
                        key="sell_signals"
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
    
    ### Buy Signals
    A stock generates a buy signal when ALL three conditions are met simultaneously:
    1. RSI is below 30 (oversold)
    2. MACD shows a bullish crossover
    3. Price is below the lower Bollinger Band
    
    ### Sell Signals
    A stock generates a sell signal when ANY TWO of these three conditions are met:
    1. RSI is above 70 (overbought)
    2. MACD shows a bearish crossover
    3. Price is above the upper Bollinger Band
    
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
    
    **Interpretation:**
    - RSI < 30: Oversold condition (Buy signal)
    - RSI > 70: Overbought condition (Sell signal)
    - RSI = 50: Neutral
    
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
    
    where EMA = Price × (2 ÷ (n + 1)) + EMA[previous] × (1 - (2 ÷ (n + 1)))
    n = number of days
    ```
    
    **Interpretation:**
    - Bullish Crossover (Buy signal): MACD Line crosses above Signal Line
    - Bearish Crossover (Sell signal): MACD Line crosses below Signal Line
    
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
    
    where:
    SMA = (P₁ + P₂ + ... + P₂₀) / 20
    Standard Deviation = √(Σ(x - μ)² / n)
    ```
    
    **Interpretation:**
    - Price below Lower Band (Buy signal): Potentially oversold
    - Price above Upper Band (Sell signal): Potentially overbought
    - Price near Middle Band: Normal trading range
    
    ## 📈 Analysis Process
    
    1. **Data Collection:**
       - Fetches daily price data based on selected lookback period
       - Available periods: 1D, 5D, 1M, 6M, 1Y, 5Y
    
    2. **Portfolio Analysis:**
       - Checks current portfolio positions for sell signals
       - Requires any 2 out of 3 sell conditions to trigger
    
    3. **S&P 500 Analysis:**
       - Analyzes all S&P 500 stocks for buy signals
       - Requires all 3 buy conditions to trigger
    
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
                # Create unique ID for the transaction
                transaction_id = str(uuid.uuid4())
                
                # Add to portfolio
                new_position = pd.DataFrame({
                    'ID': [transaction_id],
                    'Symbol': [buy_symbol],
                    'Shares': [buy_shares],
                    'Buy Price': [buy_price],
                    'Buy Date': [buy_date],
                    'Total Cost': [buy_shares * buy_price]
                })
                
                st.session_state.portfolio = pd.concat([st.session_state.portfolio, new_position], ignore_index=True)
                save_portfolio_data(st.session_state.portfolio, st.session_state.transactions)
                st.success(f"Successfully logged purchase of {buy_shares} shares of {buy_symbol} at ${buy_price:.2f}")
    
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
                        # Calculate profit/loss
                        profit = (sell_price - position['Buy Price']) * position['Shares']
                        return_pct = ((sell_price - position['Buy Price']) / position['Buy Price']) * 100
                        
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
                            'Return %': [return_pct]
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
    
    with portfolio_tab:
        st.subheader("Current Portfolio")
        
        # Display portfolio statistics
        col1, col2, col3 = st.columns(3)
        
        with col1:
            win_rate = (st.session_state.win_count / st.session_state.total_trades * 100) if st.session_state.total_trades > 0 else 0
            st.metric("Win Rate", f"{win_rate:.1f}%")
        
        with col2:
            st.metric("Total Profit/Loss", f"${st.session_state.total_profit:.2f}")
        
        with col3:
            st.metric("Total Trades", st.session_state.total_trades)
        
        # Display current portfolio
        if not st.session_state.portfolio.empty:
            st.dataframe(st.session_state.portfolio)
        else:
            st.info("No positions in portfolio.")
    
    with history_tab:
        st.subheader("Transaction History")
        
        if not st.session_state.transactions.empty:
            st.dataframe(st.session_state.transactions)
            
            # Download button for transaction history
            csv = st.session_state.transactions.to_csv(index=False)
            st.download_button(
                label="Download Transaction History",
                data=csv,
                file_name="transaction_history.csv",
                mime="text/csv"
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
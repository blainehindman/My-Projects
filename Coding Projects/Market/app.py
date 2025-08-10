import alpaca_trade_api as tradeapi
import pandas as pd
import numpy as np
from ta.momentum import RSIIndicator, StochasticOscillator, ROCIndicator
from ta.trend import MACD, EMAIndicator, ADXIndicator
from ta.volatility import BollingerBands, AverageTrueRange
from ta.volume import OnBalanceVolumeIndicator, ForceIndexIndicator
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import time
import multiprocessing
from multiprocessing import Pool, cpu_count
from tqdm import tqdm

# Load environment variables
load_dotenv()

# Your Alpaca credentials
API_KEY = os.getenv('ALPACA_API_KEY')
API_SECRET = os.getenv('ALPACA_API_SECRET')
BASE_URL = os.getenv('ALPACA_API_BASE_URL')

if not all([API_KEY, API_SECRET, BASE_URL]):
    print("\nError: Missing Alpaca API credentials in .env file!")
    print("Please ensure you have a .env file with:")
    print("ALPACA_API_KEY=your_key")
    print("ALPACA_API_SECRET=your_secret")
    print("ALPACA_API_BASE_URL=https://paper-api.alpaca.markets")
    exit(1)

# Create API connection - one per process
def get_api():
    return tradeapi.REST(API_KEY, API_SECRET, BASE_URL, api_version='v2')

# Global variable to store API connection per process
api = None

def init_worker():
    global api
    api = get_api()

def get_sp500_tickers():
    url = 'https://en.wikipedia.org/wiki/List_of_S%26P_500_companies'
    tables = pd.read_html(url)
    return tables[0]['Symbol'].tolist()

def fetch_historical_data(api_instance, ticker, start_date, end_date, max_retries=3):
    for attempt in range(max_retries):
        try:
            end_date = end_date - timedelta(days=1)
            start_str = start_date.strftime('%Y-%m-%d')
            end_str = end_date.strftime('%Y-%m-%d')
            
            # Add delay between API calls to respect rate limits
            if attempt > 0:
                time.sleep(1)  # Only sleep on retries
            
            bars = api_instance.get_bars(
                ticker,
                tradeapi.TimeFrame.Day,
                start=start_str,
                end=end_str,
                adjustment='raw'
            ).df
            
            if len(bars) > 0:
                return bars.copy()
            else:
                return None
                
        except Exception as e:
            if "Too Many Requests" in str(e) or "429" in str(e):
                if attempt < max_retries - 1:
                    time.sleep(2)  # Wait longer for rate limits
                    continue
            return None

def calculate_technical_indicators(df):
    """Calculate all technical indicators used in both buy and sell analysis"""
    if df is None or len(df) < 30:
        return None
    
    try:
        df = df.copy()
        
        # Verify data quality
        if df['high'].min() <= 0 or df['low'].min() <= 0 or df['close'].min() <= 0:
            return None
            
        if (df['high'] < df['low']).any():
            return None
        
        # Calculate all indicators at once
        close = df['close']
        high = df['high']
        low = df['low']
        volume = df['volume']
        
        # Price volatility and trend metrics
        df['Daily_Return'] = close.pct_change()
        df['Volatility_20d'] = df['Daily_Return'].rolling(20).std() * np.sqrt(252)  # Annualized
        df['Price_Range'] = (high - low) / close  # Daily price range as percentage
        
        # Volume analysis
        df['Volume_MA5'] = df['volume'].rolling(5).mean()
        df['Volume_MA20'] = df['volume'].rolling(20).mean()
        df['Volume_Ratio'] = df['volume'] / df['Volume_MA20']
        df['Volume_Trend'] = df['Volume_MA5'] / df['Volume_MA20']
        
        # Technical indicators
        df['RSI'] = RSIIndicator(close).rsi()
        macd = MACD(close)
        df['MACD'] = macd.macd()
        df['MACD_signal'] = macd.macd_signal()
        df['MACD_diff'] = macd.macd_diff()
        
        bb = BollingerBands(close)
        df['BB_upper'] = bb.bollinger_hband()
        df['BB_lower'] = bb.bollinger_lband()
        df['BB_middle'] = bb.bollinger_mavg()
        df['BB_width'] = (df['BB_upper'] - df['BB_lower']) / df['BB_middle']
        
        df['Stoch_k'] = StochasticOscillator(high, low, close).stoch()
        df['ADX'] = ADXIndicator(high, low, close).adx()
        df['EMA20'] = EMAIndicator(close, window=20).ema_indicator()
        df['EMA50'] = EMAIndicator(close, window=50).ema_indicator()
        
        return df
        
    except Exception as e:
        print(f"Error in indicator calculation: {e}")
        return None

def calculate_buy_signals(df):
    """Calculate buy signals using the original logic"""
    df_with_indicators = calculate_technical_indicators(df)
    if df_with_indicators is None:
        return None, None, {}, None
    
    try:
        # Get latest values and statistical context
        latest = df_with_indicators.iloc[-1]
        recent = df_with_indicators.iloc[-5:]  # Last week of trading
        
        # Volume analysis
        recent_volume_trend = recent['Volume_Ratio'].mean()
        volume_consistency = (recent['Volume_Ratio'] > 1.2).sum() >= 3  # High volume in 3 of last 5 days
        
        # Volatility context
        current_volatility = latest['Volatility_20d']
        avg_volatility = df_with_indicators['Volatility_20d'].mean()
        volatility_ratio = current_volatility / avg_volatility
        
        # Price trend strength
        price_trend = (latest['close'] / df_with_indicators['close'].iloc[-5] - 1) * 100  # 5-day price trend
        trend_consistency = (df_with_indicators['Daily_Return'].iloc[-5:] > 0).sum() >= 3  # Positive returns in 3 of last 5 days
        
        # Calculate metrics
        signal_metrics = {
            'RSI': latest['RSI'],
            'MACD_diff': latest['MACD_diff'],
            'BB_position': (latest['close'] - latest['BB_lower']) / (latest['BB_upper'] - latest['BB_lower']),
            'BB_width': latest['BB_width'],
            'Stoch_k': latest['Stoch_k'],
            'ADX': latest['ADX'],
            'Volume_trend': (latest['Volume_MA5'] / latest['Volume_MA20'] - 1) * 100,
            'Volatility': current_volatility,
            'Price_trend': price_trend,
            'EMA_alignment': bool((latest['EMA20'] > latest['EMA50']) and (latest['close'] > latest['EMA20']))
        }
        
        # Enhanced signal conditions
        oversold = bool(latest['RSI'] < 40)  # More generous RSI threshold for oversold
        momentum_shift = bool(latest['MACD_diff'] > 0.05)  # More achievable momentum requirement
        volume_confirmation = bool(recent_volume_trend > 1.2 and volume_consistency)  # Reasonable volume threshold
        trend_strength = bool(latest['ADX'] > 20)  # Standard trend strength
        price_support = bool(latest['close'] < latest['BB_lower'] * 1.05)  # More realistic support level
        volatility_favorable = bool(0.6 < volatility_ratio < 2.0)  # More accommodating volatility range
        
        # Calculate probability with statistical context
        probability = 0
        
        # Price action (30 points max)
        probability += 15 if price_support else (10 if latest['close'] < latest['BB_lower'] * 1.08 else 0)
        probability += 15 if trend_consistency and price_trend > 0 else (10 if price_trend > -2 else 0)
        
        # Momentum (25 points max)
        probability += 15 if latest['RSI'] < 40 else (10 if latest['RSI'] < 45 else 0)
        probability += 10 if latest['MACD_diff'] > 0.05 else (5 if latest['MACD_diff'] > -0.02 else 0)
        
        # Volume (25 points max)
        probability += 15 if recent_volume_trend > 1.2 and volume_consistency else (10 if recent_volume_trend > 1.0 else 0)
        probability += 10 if signal_metrics['Volume_trend'] > 5 else (5 if signal_metrics['Volume_trend'] > 0 else 0)
        
        # Technical strength (20 points max)
        probability += 10 if latest['ADX'] > 20 else (5 if latest['ADX'] > 15 else 0)
        probability += 10 if signal_metrics['EMA_alignment'] else (5 if latest['close'] > latest['EMA50'] else 0)
        
        # Final signal - more balanced criteria
        signal = bool(
            probability >= 65 and  # More achievable probability threshold
            (
                (oversold and (momentum_shift or price_support)) or  # Need oversold + one confirmation
                (trend_strength and (volume_confirmation or volatility_favorable)) or  # Need trend + one confirmation
                (price_support and volume_confirmation) or  # Classic support bounce setup
                (momentum_shift and trend_strength and volatility_favorable)  # Strong technical setup
            )
        )
        
        return signal, probability, signal_metrics, latest['close']
        
    except Exception as e:
        print(f"Error in buy signal calculation: {e}")
        return None, None, {}, None

def calculate_sell_signals(df):
    """Calculate sell signals using inverted logic for overbought/weakening conditions"""
    df_with_indicators = calculate_technical_indicators(df)
    if df_with_indicators is None:
        return None, None, {}, None
    
    try:
        # Get latest values and statistical context
        latest = df_with_indicators.iloc[-1]
        recent = df_with_indicators.iloc[-5:]  # Last week of trading
        
        # Volume analysis
        recent_volume_trend = recent['Volume_Ratio'].mean()
        volume_confirmation = (recent['Volume_Ratio'] > 1.2).sum() >= 3  # High volume in 3 of last 5 days
        
        # Volatility context
        current_volatility = latest['Volatility_20d']
        avg_volatility = df_with_indicators['Volatility_20d'].mean()
        volatility_ratio = current_volatility / avg_volatility
        
        # Price trend strength (for sells, we look for weakness)
        price_trend = (latest['close'] / df_with_indicators['close'].iloc[-5] - 1) * 100  # 5-day price trend
        trend_weakness = (df_with_indicators['Daily_Return'].iloc[-5:] < 0).sum() >= 3  # Negative returns in 3 of last 5 days
        
        # Calculate metrics
        signal_metrics = {
            'RSI': latest['RSI'],
            'MACD_diff': latest['MACD_diff'],
            'BB_position': (latest['close'] - latest['BB_lower']) / (latest['BB_upper'] - latest['BB_lower']),
            'BB_width': latest['BB_width'],
            'Stoch_k': latest['Stoch_k'],
            'ADX': latest['ADX'],
            'Volume_trend': (latest['Volume_MA5'] / latest['Volume_MA20'] - 1) * 100,
            'Volatility': current_volatility,
            'Price_trend': price_trend,
            'EMA_alignment': bool((latest['EMA20'] < latest['EMA50']) and (latest['close'] < latest['EMA20']))
        }
        
        # Sell signal conditions (opposite of buy signals)
        overbought = bool(latest['RSI'] > 70)  # Overbought condition
        severe_overbought = bool(latest['RSI'] > 80)  # Severely overbought
        momentum_declining = bool(latest['MACD_diff'] < -0.05)  # Declining momentum
        weak_momentum = bool(latest['MACD_diff'] < 0)  # Weak momentum
        volume_selling = bool(recent_volume_trend > 1.2 and volume_confirmation)  # High volume (could be selling)
        trend_strong = bool(latest['ADX'] > 20)  # Strong trend (good for breakouts either way)
        price_resistance = bool(latest['close'] > latest['BB_upper'] * 0.95)  # Near resistance
        volatility_high = bool(volatility_ratio > 1.5)  # High volatility might indicate uncertainty
        
        # Calculate sell probability 
        probability = 0
        
        # Price action weakness (30 points max)
        probability += 20 if price_resistance else (10 if latest['close'] > latest['BB_upper'] * 0.97 else 0)
        probability += 15 if trend_weakness and price_trend < 0 else (10 if price_trend < -1 else 0)
        
        # Momentum weakness (25 points max)
        probability += 20 if severe_overbought else (15 if overbought else (10 if latest['RSI'] > 60 else 0))
        probability += 10 if momentum_declining else (5 if weak_momentum else 0)
        
        # Volume concerns (25 points max)
        probability += 15 if volume_selling and trend_weakness else (10 if volume_selling else 0)
        probability += 10 if signal_metrics['Volume_trend'] > 10 else (5 if signal_metrics['Volume_trend'] > 5 else 0)
        
        # Technical weakness (20 points max)
        probability += 10 if trend_strong and momentum_declining else (5 if trend_strong else 0)
        probability += 10 if signal_metrics['EMA_alignment'] else (5 if latest['close'] < latest['EMA20'] else 0)
        
        # Final sell signal
        sell_signal = bool(
            probability >= 60 and  # Sell threshold (slightly lower than buy)
            (
                (overbought and (momentum_declining or price_resistance)) or  # Overbought + confirmation
                (trend_strong and volume_selling and trend_weakness) or  # Strong selling pressure
                (price_resistance and volume_selling) or  # Resistance rejection with volume
                (severe_overbought and volatility_high)  # Extreme overbought with volatility
            )
        )
        
        return sell_signal, probability, signal_metrics, latest['close']
        
    except Exception as e:
        print(f"Error in sell signal calculation: {e}")
        return None, None, {}, None

def backtest_signal(df, signal_type='buy'):
    """Backtest signals with appropriate logic for buy or sell"""
    if df is None or len(df) < 30:
        return False, 0, 0
    
    try:
        # Calculate all indicators once
        df_with_indicators = calculate_technical_indicators(df)
        if df_with_indicators is None:
            return False, 0, 0
            
        # Calculate signals for each point
        signals = pd.Series(False, index=df_with_indicators.index)
        
        for i in range(30, len(df_with_indicators)):
            historical_df = df_with_indicators.iloc[:i+1].copy()
            if signal_type == 'buy':
                signal, _, _, _ = calculate_buy_signals(historical_df)
            else:  # sell
                signal, _, _, _ = calculate_sell_signals(historical_df)
            signals.iloc[i] = bool(signal) if signal is not None else False
        
        # Assign signals and calculate returns
        df_with_indicators.loc[:, 'Signal'] = signals
        if signal_type == 'buy':
            # For buy signals, we measure positive returns going forward
            df_with_indicators.loc[:, 'Return_5d'] = df_with_indicators['close'].pct_change(periods=5).shift(-5)
        else:
            # For sell signals, we measure negative returns going forward (good for sells)
            df_with_indicators.loc[:, 'Return_5d'] = -df_with_indicators['close'].pct_change(periods=5).shift(-5)
        
        # Enhanced performance analysis
        valid_signals = df_with_indicators[df_with_indicators['Signal']]
        if len(valid_signals) < 3:  # Need more historical signals
            return False, 0, 0
        
        # Calculate risk-adjusted metrics
        win_rate = (valid_signals['Return_5d'] > 0).mean() * 100
        avg_return = valid_signals['Return_5d'].mean() * 100
        return_std = valid_signals['Return_5d'].std() * 100
        
        if return_std == 0:
            return False, 0, 0
            
        sharpe_ratio = (avg_return / return_std) * np.sqrt(252/5)  # Annualized Sharpe Ratio
        
        # Success criteria for backtesting
        success = (
            win_rate > 50 and  # Reasonable win rate for sells
            avg_return > 1.0 and  # Lower return expectation for sells
            sharpe_ratio > 0.8 and  # Slightly lower Sharpe ratio threshold
            len(valid_signals) >= 3  # Minimum historical signals
        )
        
        return success, win_rate, avg_return
        
    except Exception as e:
        print(f"Error in backtesting: {e}")
        return False, 0, 0

def analyze_stock_for_buy(ticker, start_date, end_date, api_instance):
    """Analyze a single stock for buy signals"""
    try:
        # Initialize result with ticker
        result = {'Ticker': ticker}
        
        # Fetch and analyze data
        df = fetch_historical_data(api_instance, ticker, start_date, end_date)
        if df is None or len(df) < 30:
            result.update({
                'Data_Available': 'No',
                'Reason': 'No data or insufficient data points'
            })
            return result

        signal, probability, metrics, close = calculate_buy_signals(df)
        if signal is None:
            result.update({
                'Data_Available': 'No',
                'Reason': 'Error calculating signals'
            })
            return result
            
        backtest_success, win_rate, avg_return = backtest_signal(df, 'buy')
        
        # Record ALL metrics
        result.update({
            'Data_Available': 'Yes',
            'Close': round(close, 2),
            'RSI': round(metrics['RSI'], 2),
            'MACD_Differential': round(metrics['MACD_diff'], 4),
            'BB_Position': round(metrics['BB_position'], 2),
            'Stoch_Position': round(metrics['Stoch_k'], 2),
            'ADX': round(metrics['ADX'], 2),
            'Volume_Trend': round(metrics['Volume_trend'], 2),
            'Volatility_Change': round(metrics['Volatility'], 2),
            'Price_Momentum': round(metrics['Price_trend'], 2),
            'EMA_Alignment': metrics['EMA_alignment'],
            'Signal_Probability': round(probability, 2),
            'Win_Rate': round(win_rate, 2),
            'Avg_Return': round(avg_return, 2),
            'Signal_Active': 'Yes' if signal else 'No',
            'Backtest_Support': 'Yes' if backtest_success else 'No'
        })
        
        return result
        
    except Exception as e:
        return {
            'Ticker': ticker,
            'Data_Available': 'No',
            'Reason': str(e)
        }

def analyze_stock_for_sell(ticker, start_date, end_date, api_instance):
    """Analyze a single stock for sell signals"""
    try:
        # Initialize result with ticker
        result = {'Ticker': ticker}
        
        # Fetch and analyze data
        df = fetch_historical_data(api_instance, ticker, start_date, end_date)
        if df is None or len(df) < 30:
            result.update({
                'Data_Available': 'No',
                'Reason': 'No data or insufficient data points'
            })
            return result

        signal, probability, metrics, close = calculate_sell_signals(df)
        if signal is None:
            result.update({
                'Data_Available': 'No',
                'Reason': 'Error calculating signals'
            })
            return result
            
        backtest_success, win_rate, avg_return = backtest_signal(df, 'sell')
        
        # Record ALL metrics
        result.update({
            'Data_Available': 'Yes',
            'Close': round(close, 2),
            'RSI': round(metrics['RSI'], 2),
            'MACD_Differential': round(metrics['MACD_diff'], 4),
            'BB_Position': round(metrics['BB_position'], 2),
            'Stoch_Position': round(metrics['Stoch_k'], 2),
            'ADX': round(metrics['ADX'], 2),
            'Volume_Trend': round(metrics['Volume_trend'], 2),
            'Volatility_Change': round(metrics['Volatility'], 2),
            'Price_Momentum': round(metrics['Price_trend'], 2),
            'EMA_Alignment': metrics['EMA_alignment'],
            'Signal_Probability': round(probability, 2),
            'Win_Rate': round(win_rate, 2),
            'Avg_Return': round(avg_return, 2),
            'Signal_Active': 'Yes' if signal else 'No',
            'Backtest_Support': 'Yes' if backtest_success else 'No',
            'Recommendation': 'SELL' if (signal and backtest_success) else 'HOLD'
        })
        
        return result
        
    except Exception as e:
        return {
            'Ticker': ticker,
            'Data_Available': 'No',
            'Reason': str(e)
        }

def run_buy_analysis():
    """Run the buy analysis for all S&P 500 stocks"""
    print("\n=== S&P 500 BUY Opportunities Analyzer ===")
    
    # Get list of tickers
    tickers = get_sp500_tickers()
    
    # Get dates for analysis
    end_date = datetime.today()
    start_date = end_date - timedelta(days=365)
    
    print(f"\nAnalyzing {len(tickers)} stocks for BUY opportunities...")

    # Initialize API
    api = tradeapi.REST(API_KEY, API_SECRET, BASE_URL, api_version='v2')
    
    # Store all results
    all_results = []
    total = len(tickers)
    strong_buy_count = 0
    
    for idx, ticker in enumerate(tickers, 1):
        print(f"\rProgress: {ticker} ({idx}/{total})", end="", flush=True)
        
        result = analyze_stock_for_buy(ticker, start_date, end_date, api)
        
        # Check for strong buy signals (>65% probability AND >60% win rate)
        if (result.get('Signal_Active') == 'Yes' and 
            result.get('Backtest_Support') == 'Yes' and
            result.get('Signal_Probability', 0) > 65 and
            result.get('Win_Rate', 0) > 60):
            
            strong_buy_count += 1
            probability = result.get('Signal_Probability', 0)
            win_rate = result.get('Win_Rate', 0)
            price = result.get('Close', 0)
            
            print(f"\n\n📊 {ticker} Analysis:")
            print(f"   Current Price: ${price:.2f}")
            print(f"   Recommendation: STRONG BUY")
            print(f"   Buy Probability: {probability:.1f}%")
            print(f"   Historical Win Rate: {win_rate:.1f}%")
            print(f"   RSI: {result.get('RSI', 'N/A')}")
            print(f"   MACD: {result.get('MACD_Differential', 'N/A')}")
            print(f"   ADX: {result.get('ADX', 'N/A')}")
            print(f"   Volume Trend: {result.get('Volume_Trend', 'N/A')}%")
            print(f"   🟢 STRONG BUY SIGNAL - Consider buying {ticker}")
        
        all_results.append(result)
    
    # Analysis complete
    print(f"\n\n=== BUY Analysis Complete ===")
    print(f"Total stocks analyzed: {len(all_results)}")
    print(f"Strong BUY signals found: {strong_buy_count}")
    
    # Create and save results
    save_results(all_results, 'buy')
    return all_results

def run_sell_analysis():
    """Run the sell analysis for user-specified stocks"""
    print("\n=== SELL Signal Analyzer ===")
    
    # Get user input for tickers
    user_input = input("\nEnter stock ticker(s) separated by commas (e.g., AAPL, MSFT, GOOGL): ").strip()
    
    if not user_input:
        print("No tickers provided. Returning to menu.")
        return []
    
    # Parse tickers
    tickers = [ticker.strip().upper() for ticker in user_input.split(',')]
    tickers = [ticker for ticker in tickers if ticker]  # Remove empty strings
    
    if not tickers:
        print("No valid tickers provided. Returning to menu.")
        return []
    
    print(f"\nAnalyzing {len(tickers)} stocks for SELL signals: {', '.join(tickers)}")
    
    # Get dates for analysis
    end_date = datetime.today()
    start_date = end_date - timedelta(days=365)
    
    # Initialize API
    api = tradeapi.REST(API_KEY, API_SECRET, BASE_URL, api_version='v2')
    
    # Store all results
    all_results = []
    
    for idx, ticker in enumerate(tickers, 1):
        print(f"\nAnalyzing {ticker} ({idx}/{len(tickers)})...")
        
        result = analyze_stock_for_sell(ticker, start_date, end_date, api)
        
        if result.get('Data_Available') == 'Yes':
            recommendation = result.get('Recommendation', 'HOLD')
            probability = result.get('Signal_Probability', 0)
            win_rate = result.get('Win_Rate', 0)
            price = result.get('Close', 0)
            
            print(f"\n📊 {ticker} Analysis:")
            print(f"   Current Price: ${price:.2f}")
            print(f"   Recommendation: {recommendation}")
            print(f"   Sell Probability: {probability:.1f}%")
            print(f"   Historical Win Rate: {win_rate:.1f}%")
            print(f"   RSI: {result.get('RSI', 'N/A')}")
            print(f"   MACD: {result.get('MACD_Differential', 'N/A')}")
            
            if recommendation == 'SELL':
                print(f"   🔴 STRONG SELL SIGNAL - Consider selling {ticker}")
            else:
                print(f"   🟡 HOLD - No strong sell signal for {ticker}")
        else:
            print(f"   ❌ Could not analyze {ticker}: {result.get('Reason', 'Unknown error')}")
        
        all_results.append(result)
    
    # Save results
    save_results(all_results, 'sell')
    return all_results

def save_results(results, analysis_type):
    """Save analysis results to Excel"""
    if not results:
        return
    
    print(f"\n\nCreating {analysis_type} analysis report...")
    df = pd.DataFrame(results)
    
    # Sort by probability and backtest confirmation
    df.sort_values(
        by=['Signal_Probability', 'Backtest_Support', 'Win_Rate'],
        ascending=[False, False, False],
        inplace=True
    )
    
    # Save to Excel
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    excel_file = f'{analysis_type}_signals_{timestamp}.xlsx'
    
    try:
        df.to_excel(excel_file, index=False)
        print(f"Results saved to: {os.path.abspath(excel_file)}")
        
        # Summary statistics
        if analysis_type == 'buy':
            strong_signals = df[df['Backtest_Support'] == 'Yes']
            print(f"Total stocks analyzed: {len(df)}")
            print(f"Strong BUY signals found: {len(strong_signals)}")
        else:  # sell
            sell_signals = df[df['Recommendation'] == 'SELL']
            print(f"Total stocks analyzed: {len(df)}")
            print(f"SELL recommendations: {len(sell_signals)}")
            
    except Exception as e:
        print(f"Error saving Excel file: {e}")

def show_menu():
    """Display the main menu"""
    print("\n" + "="*50)
    print("    📈 TRADING SIGNAL ANALYZER 📉")
    print("="*50)
    print("\n1. 📊 Buy List - Analyze S&P 500 for buy opportunities")
    print("2. 🔴 Sell List - Analyze your stocks for sell signals")  
    print("3. ❌ Exit")
    print("\n" + "="*50)

def main():
    """Main function with menu system"""
    print("\n🚀 Welcome to the Advanced Trading Signal Analyzer!")
    
    while True:
        show_menu()
        
        try:
            choice = input("\nSelect an option (1-3): ").strip()
            
            if choice == '1':
                run_buy_analysis()
                input("\nPress Enter to return to menu...")
                
            elif choice == '2':
                run_sell_analysis()
                input("\nPress Enter to return to menu...")
                
            elif choice == '3':
                print("\n👋 Thank you for using the Trading Signal Analyzer!")
                break
                
            else:
                print("❌ Invalid option. Please select 1, 2, or 3.")
                
        except KeyboardInterrupt:
            print("\n\n👋 Program interrupted. Goodbye!")
            break
        except Exception as e:
            print(f"\n❌ An error occurred: {e}")
            input("Press Enter to continue...")

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\nProgram interrupted by user. Exiting...")

<h1>Trading with RSI and MACD Indicators in Parallel</h1>
The code will now include logic to calculate the RSI (Relative Strength Index) and MACD (Moving Average Convergence Divergence) indicators. Additionally, we will trade multiple currency pairs in parallel using Tokio's concurrency features.

Here's the approach:

RSI and MACD Calculation: We'll use the ta crate (technical analysis) to calculate RSI and MACD.
Parallel Trading: For multiple currencies, we'll leverage Tokio tasks to handle trading for each pair independently but concurrently.
Decision Logic: We’ll implement basic buy/sell logic based on:
RSI: Buying when RSI < 30 (oversold) and selling when RSI > 70 (overbought).
MACD: Buying when the MACD line crosses above the signal line and selling when it crosses below.
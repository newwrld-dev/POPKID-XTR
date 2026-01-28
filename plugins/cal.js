import config from '../config.cjs';

const report = async (m, gss) => {
  try {
    const prefix = config.PREFIX;
    const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
    const text = m.body.slice(prefix.length + cmd.length).trim();

    const validCommands = ['cal', 'calculator', 'calc', 'calculate', 'math'];
    
    if (validCommands.includes(cmd)) {
      if (!text) {
        return m.reply('Please provide a mathematical expression.\nExample: .calc 15 + (20 * 3)');
      }

      // Secure evaluation function
      const safeEval = (expression) => {
        // Clean and normalize the expression
        let cleaned = expression
          .replace(/[^0-9\-\/+*×÷πEe()piPI.sqrt\s]/g, '') // Allow sqrt
          .replace(/×/g, '*')
          .replace(/÷/g, '/')
          .replace(/π|pi/gi, 'Math.PI')
          .replace(/e/gi, 'Math.E')
          .replace(/sqrt\(/gi, 'Math.sqrt(')
          .replace(/\s+/g, '') // Remove whitespace
          .replace(/\/+/g, '/')
          .replace(/\++/g, '+')
          .replace(/-+/g, '-');
        
        // Additional safety checks
        const dangerousPatterns = [
          /(?:function|=>|=>|new|constructor|prototype|__proto__|process|require|module|exports|console|window|document|alert|eval)/i,
          /[`'";]/,
          /Math\.(?!PI|E|sqrt)[a-zA-Z]/,
        ];
        
        for (const pattern of dangerousPatterns) {
          if (pattern.test(cleaned)) {
            throw new Error('Invalid characters or unsafe operations detected');
          }
        }
        
        // Validate parentheses
        let parenCount = 0;
        for (const char of cleaned) {
          if (char === '(') parenCount++;
          if (char === ')') parenCount--;
          if (parenCount < 0) throw new Error('Mismatched parentheses');
        }
        if (parenCount !== 0) throw new Error('Mismatched parentheses');
        
        return cleaned;
      };

      try {
        // Safe evaluation using Function constructor but with restricted scope
        const expression = safeEval(text);
        const format = expression
          .replace(/Math\.PI/g, 'π')
          .replace(/Math\.E/g, 'e')
          .replace(/Math\.sqrt\(/g, '√(')
          .replace(/\//g, '÷')
          .replace(/\*/g, '×');
        
        // Create a restricted context for evaluation
        const context = {
          Math: {
            PI: Math.PI,
            E: Math.E,
            sqrt: Math.sqrt
          }
        };
        
        // Safer evaluation using Function with limited scope
        const calculator = new Function('Math', `return ${expression}`);
        const result = calculator(context.Math);
        
        if (typeof result !== 'number' || !isFinite(result)) {
          throw new Error('Invalid calculation result');
        }
        
        // Format the result nicely
        let formattedResult;
        if (Number.isInteger(result)) {
          formattedResult = result.toString();
        } else {
          // Limit decimal places for readability
          formattedResult = parseFloat(result.toFixed(10)).toString();
          // Remove trailing zeros
          formattedResult = formattedResult.replace(/(\.\d*?[1-9])0+$/, '$1').replace(/\.$/, '');
        }
        
        // Send the result
        await m.reply(`*Calculation:* ${format}\n*Result:* ${formattedResult}`);
        
      } catch (calcError) {
        if (calcError.message.includes('Invalid characters')) {
          return m.reply('Invalid expression. Only basic math operations are allowed.\nAllowed: +, -, *, /, √, π, e, parentheses, numbers');
        } else if (calcError.message.includes('Mismatched')) {
          return m.reply('Error: Mismatched parentheses in your expression.');
        } else if (calcError.message.includes('Invalid calculation')) {
          return m.reply('Cannot calculate that expression. Please check your input.');
        } else {
          // Provide helpful examples for common errors
          return m.reply(
            `Calculation error. Please check your expression.\n\n` +
            `*Examples:*\n` +
            `• ${prefix}calc 15 + 27\n` +
            `• ${prefix}calc (10 * 3) / 2\n` +
            `• ${prefix}calc √(16) + π\n` +
            `• ${prefix}calc 2 * 3.14159 * 5`
          );
        }
      }
    }
  } catch (error) {
    console.error('Calc command error:', error);
    return m.reply('An unexpected error occurred. Please try again.');
  }
};

export default report;

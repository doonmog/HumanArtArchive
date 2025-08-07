class SearchParser {
  constructor() {
    this.tokens = [];
    this.position = 0;
    this.parameters = [];
    this.hasVersionFilter = false;
  }

  tokenize(query) {
    const tokens = [];
    let i = 0;
    
    while (i < query.length) {
      const char = query[i];
      
      if (char === ' ' || char === '\t' || char === '\n') {
        i++;
        continue;
      }
      
      if (char === '(') {
        tokens.push({ type: 'LPAREN', value: '(' });
        i++;
      } else if (char === ')') {
        tokens.push({ type: 'RPAREN', value: ')' });
        i++;
      } else if (char === '"') {
        let value = '';
        i++;
        while (i < query.length && query[i] !== '"') {
          value += query[i];
          i++;
        }
        if (i < query.length) i++;
        tokens.push({ type: 'QUOTED_STRING', value });
      } else if (char === '>' && i + 1 < query.length && query[i + 1] === '=') {
        tokens.push({ type: 'GTE', value: '>=' });
        i += 2;
      } else if (char === '<' && i + 1 < query.length && query[i + 1] === '=') {
        tokens.push({ type: 'LTE', value: '<=' });
        i += 2;
      } else if (char === '>') {
        tokens.push({ type: 'GT', value: '>' });
        i++;
      } else if (char === '<') {
        tokens.push({ type: 'LT', value: '<' });
        i++;
      } else if (char === '=') {
        tokens.push({ type: 'EQ', value: '=' });
        i++;
      } else if (char === ':') {
        tokens.push({ type: 'COLON', value: ':' });
        i++;
      } else {
        let value = '';
        while (i < query.length && 
               query[i] !== ' ' && query[i] !== '\t' && query[i] !== '\n' &&
               query[i] !== '(' && query[i] !== ')' && query[i] !== '"' &&
               query[i] !== '>' && query[i] !== '<' && query[i] !== '=' &&
               query[i] !== ':') {
          value += query[i];
          i++;
        }
        
        const upperValue = value.toUpperCase();
        if (upperValue === 'AND') {
          tokens.push({ type: 'AND', value: 'AND' });
        } else if (upperValue === 'OR') {
          tokens.push({ type: 'OR', value: 'OR' });
        } else if (upperValue === 'NOT') {
          tokens.push({ type: 'NOT', value: 'NOT' });
        } else {
          tokens.push({ type: 'IDENTIFIER', value });
        }
      }
    }
    
    return tokens;
  }

  parse(query) {
    this.tokens = this.tokenize(query);
    this.position = 0;
    this.parameters = [];
    this.hasVersionFilter = false;
    
    const ast = this.parseExpression();
    return {
      whereClause: this.generateSQL(ast),
      parameters: this.parameters,
      hasVersionFilter: this.hasVersionFilter
    };
  }

  parseExpression() {
    let left = this.parseTerm();

    while (this.position < this.tokens.length) {
      const token = this.tokens[this.position];

      // If we're at the end of the query or see a closing parenthesis, stop.
      if (!token || token.type === 'RPAREN') {
        break;
      }

      let operator;
      // Explicit AND/OR
      if (token.type === 'AND' || token.type === 'OR') {
        operator = token.type;
        this.position++;
      } else {
        // Implicit AND
        operator = 'AND';
      }

      const right = this.parseTerm();
      left = {
        type: 'BINARY_OP',
        operator: operator,
        left,
        right
      };
    }

    return left;
  }

  parseTerm() {
    const token = this.tokens[this.position];
    
    if (!token) {
      throw new Error('Unexpected end of query');
    }
    
    if (token.type === 'NOT') {
      this.position++;
      const operand = this.parseTerm();
      return {
        type: 'UNARY_OP',
        operator: 'NOT',
        operand
      };
    }
    
    if (token.type === 'LPAREN') {
      this.position++;
      const expr = this.parseExpression();
      
      if (this.position >= this.tokens.length || this.tokens[this.position].type !== 'RPAREN') {
        throw new Error('Missing closing parenthesis');
      }
      this.position++;
      return expr;
    }
    
    if (token.type === 'IDENTIFIER') {
      const nextToken = this.tokens[this.position + 1];
      
      if (nextToken && nextToken.type === 'COLON') {
        return this.parseFieldQuery();
      } else {
        return this.parseTagQuery();
      }
    }
    
    if (token.type === 'QUOTED_STRING') {
      return this.parseTagQuery();
    }
    
    throw new Error(`Unexpected token: ${token.value}`);
  }

  parseFieldQuery() {
    const fieldToken = this.tokens[this.position];
    this.position++;
    
    if (this.position >= this.tokens.length || this.tokens[this.position].type !== 'COLON') {
      throw new Error('Expected colon after field name');
    }
    this.position++;
    
    const valueToken = this.tokens[this.position];
    if (!valueToken) {
      throw new Error('Expected value after colon');
    }
    
    let operator = 'EQ';
    let value = valueToken.value;
    
    if (valueToken.type === 'GT' || valueToken.type === 'LT' || 
        valueToken.type === 'GTE' || valueToken.type === 'LTE' || 
        valueToken.type === 'EQ') {
      operator = valueToken.type;
      this.position++;
      
      const nextToken = this.tokens[this.position];
      if (!nextToken) {
        throw new Error('Expected value after operator');
      }
      value = nextToken.value;
    }
    
    this.position++;
    
    return {
      type: 'FIELD_QUERY',
      field: fieldToken.value.toLowerCase(),
      operator,
      value
    };
  }

  parseTagQuery() {
    const token = this.tokens[this.position];
    this.position++;
    
    return {
      type: 'TAG_QUERY',
      value: token.value.toLowerCase()
    };
  }

  generateSQL(ast) {
    if (!ast) {
      return '1=1';
    }
    
    switch (ast.type) {
      case 'BINARY_OP':
        const left = this.generateSQL(ast.left);
        const right = this.generateSQL(ast.right);
        return `(${left} ${ast.operator} ${right})`;
        
      case 'UNARY_OP':
        const operand = this.generateSQL(ast.operand);
        return `NOT (${operand})`;
        
      case 'TAG_QUERY':
        return this.generateTagSQL(ast.value);
        
      case 'FIELD_QUERY':
        return this.generateFieldSQL(ast.field, ast.operator, ast.value);
        
      default:
        throw new Error(`Unknown AST node type: ${ast.type}`);
    }
  }

  generateTagSQL(tagValue) {
    // Add display_order filter if version filter is active
    const displayOrderFilter = this.hasVersionFilter ? ' AND i2.display_order = 1' : '';
    
    if (tagValue.includes('-')) {
      const [groupName, tagName] = tagValue.split('-', 2);
      this.parameters.push(groupName);
      this.parameters.push(tagName);
      const groupParamIndex = this.parameters.length - 1;
      const tagParamIndex = this.parameters.length;
      
      return `i2.image_id IN (
        SELECT DISTINCT it.image_id
        FROM image_tags it
        JOIN tag t ON it.tag_id = t.tag_id
        JOIN tag_group tg ON t.group_id = tg.group_id
        WHERE LOWER(tg.name) = $${groupParamIndex} AND LOWER(t.name) = $${tagParamIndex}
      )`;
    } else {
      this.parameters.push(tagValue);
      const paramIndex = this.parameters.length;
      return `i2.image_id IN (
        SELECT DISTINCT it.image_id
        FROM image_tags it
        JOIN tag t ON it.tag_id = t.tag_id
        WHERE LOWER(t.name) = $${paramIndex}
      )`;
    }
  }

  generateFieldSQL(field, operator, value) {
    let sqlOperator;
    switch (operator) {
      case 'GT': sqlOperator = '>'; break;
      case 'LT': sqlOperator = '<'; break;
      case 'GTE': sqlOperator = '>='; break;
      case 'LTE': sqlOperator = '<='; break;
      case 'EQ': 
      default: sqlOperator = '='; break;
    }
    
    switch (field) {
      case 'name':
        if (operator === 'EQ') {
          this.parameters.push(`%${value}%`);
          const paramIndex = this.parameters.length;
          return `LOWER(a.artwork_name) LIKE LOWER($${paramIndex})`;
        } else {
          this.parameters.push(value);
          const paramIndex = this.parameters.length;
          return `LOWER(a.artwork_name) ${sqlOperator} LOWER($${paramIndex})`;
        }
        
      case 'artist':
        if (operator === 'EQ') {
          this.parameters.push(`%${value}%`);
          const paramIndex = this.parameters.length;
          return `LOWER(ar.name) LIKE LOWER($${paramIndex})`;
        } else {
          this.parameters.push(value);
          const paramIndex = this.parameters.length;
          return `LOWER(ar.name) ${sqlOperator} LOWER($${paramIndex})`;
        }
        
      case 'year':
        this.parameters.push(parseInt(value));
        const paramIndex = this.parameters.length;
        return `a.year ${sqlOperator} $${paramIndex}`;
        
      case 'version':
        this.hasVersionFilter = true;
        if (value.toLowerCase() === 'primary') {
          return `i2.display_order = 1`;
        } else {
          throw new Error(`Unknown version value: ${value}. Use 'primary' for primary images.`);
        }
        
      default:
        throw new Error(`Unknown field: ${field}`);
    }
  }
}

function parseSearchQuery(query) {
  if (!query || query.trim() === '') {
    return {
      whereClause: '1=1',
      parameters: [],
      hasVersionFilter: false
    };
  }
  
  const parser = new SearchParser();
  try {
    return parser.parse(query.trim());
  } catch (error) {
    throw new Error(`Search syntax error: ${error.message}`);
  }
}

module.exports = {
  parseSearchQuery,
  SearchParser
};
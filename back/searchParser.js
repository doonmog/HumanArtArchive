class SearchParser {
  constructor() {
    this.tokens = [];
    this.position = 0;
    this.parameters = [];
    this.hasVersionFilter = false;
    this.partialMatch = false;
    this.tagQueries = [];
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
      } else if (char === '-') {
        tokens.push({ type: 'HYPHEN', value: '-' });
        i++;
      } else {
        let value = '';
        while (i < query.length && 
               query[i] !== ' ' && query[i] !== '\t' && query[i] !== '\n' &&
               query[i] !== '(' && query[i] !== ')' && query[i] !== '"' &&
               query[i] !== '>' && query[i] !== '<' && query[i] !== '=' &&
               query[i] !== ':' && query[i] !== '-') {
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
    this.partialMatch = false;
    this.tagQueries = [];
    
    const ast = this.parseExpression();
    return {
      whereClause: this.generateSQL(ast),
      parameters: this.parameters,
      hasVersionFilter: this.hasVersionFilter,
      partialMatch: this.partialMatch,
      tagQueries: this.tagQueries
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
    
    if (token.type === 'IDENTIFIER' || token.type === 'QUOTED_STRING') {
      // Check if this is a field query (field:value)
      if (this.position + 1 < this.tokens.length && this.tokens[this.position + 1].type === 'COLON') {
        return this.parseFieldQuery();
      }
      
      // Check if this is a tag group-tag pair (group-tag)
      // We need to look ahead for a hyphen followed by another identifier or quoted string
      if (this.position + 2 < this.tokens.length && 
          this.tokens[this.position + 1].value === '-' && 
          (this.tokens[this.position + 2].type === 'IDENTIFIER' || 
           this.tokens[this.position + 2].type === 'QUOTED_STRING')) {
        
        const groupToken = token;
        this.position += 2; // Skip the group token and the hyphen
        const tagToken = this.tokens[this.position];
        this.position++;
        
        // Get the actual values, removing quotes if necessary
        const groupValue = groupToken.type === 'QUOTED_STRING' ? 
          groupToken.value : groupToken.value.toLowerCase();
          
        const tagValue = tagToken.type === 'QUOTED_STRING' ? 
          tagToken.value : tagToken.value.toLowerCase();
        
        // Store tag queries for partial matching
        const fullTag = `${groupValue}-${tagValue}`;
        this.tagQueries.push(fullTag);
        
        return {
          type: 'GROUP_TAG_QUERY',
          groupName: groupValue,
          tagName: tagValue
        };
      }
      
      // Otherwise, it's a regular tag query
      return this.parseTagQuery();
    }
    
    throw new Error(`Unexpected token: ${token.type}`);
  }

  parseFieldQuery() {
    const fieldName = this.tokens[this.position].value;
    this.position++;
    
    if (this.position >= this.tokens.length || this.tokens[this.position].type !== 'COLON') {
      throw new Error(`Expected colon after field name ${fieldName}`);
    }
    this.position++;
    
    let operator = 'EQ';
    if (this.position < this.tokens.length) {
      const token = this.tokens[this.position];
      if (token.type === 'GT' || token.type === 'LT' || 
          token.type === 'GTE' || token.type === 'LTE' || 
          token.type === 'EQ') {
        operator = token.type;
        this.position++;
      }
    }
    
    if (this.position >= this.tokens.length) {
      throw new Error(`Expected value after operator for field ${fieldName}`);
    }
    
    let value;
    const token = this.tokens[this.position];
    
    if (token.type === 'QUOTED_STRING') {
      value = token.value;
    } else if (token.type === 'IDENTIFIER') {
      value = token.value;
    } else {
      throw new Error(`Expected string or identifier after operator for field ${fieldName}`);
    }
    
    this.position++;
    
    // Check for match:partial parameter
    if (fieldName.toLowerCase() === 'match' && value.toLowerCase() === 'partial') {
      this.partialMatch = true;
      return {
        type: 'MATCH_PARTIAL',
        value: true
      };
    }
    
    return {
      type: 'FIELD_QUERY',
      field: fieldName,
      operator,
      value
    };
  }

  parseTagQuery() {
    const tagValue = this.tokens[this.position].value;
    this.position++;
    
    // Store tag queries for partial matching
    this.tagQueries.push(tagValue.toLowerCase());
    
    return {
      type: 'TAG_QUERY',
      value: tagValue.toLowerCase()
    };
  }

  generateSQL(ast) {
    if (!ast) return '1=1';
    
    switch (ast.type) {
      case 'BINARY_OP':
        return `(${this.generateSQL(ast.left)}) ${ast.operator} (${this.generateSQL(ast.right)})`;
        
      case 'UNARY_OP':
        return `NOT (${this.generateSQL(ast.operand)})`;
        
      case 'TAG_QUERY':
        return this.generateTagSQL(ast.value);
        
      case 'GROUP_TAG_QUERY':
        return this.generateGroupTagSQL(ast.groupName, ast.tagName);
        
      case 'FIELD_QUERY':
        return this.generateFieldSQL(ast.field, ast.operator, ast.value);
        
      case 'MATCH_PARTIAL':
        // This is handled separately, just return true
        return '1=1';
        
      default:
        throw new Error(`Unknown AST node type: ${ast.type}`);
    }
  }

  generateTagSQL(tagValue) {
    // Add display_order filter if version filter is active
    const displayOrderFilter = this.hasVersionFilter ? ' AND i2.display_order = 1' : '';
    
    if (tagValue.includes('-')) {
      // Handle the case where either part might be a quoted string
      // Find the position of the first hyphen that's not inside quotes
      let inQuotes = false;
      let hyphenPos = -1;
      
      for (let i = 0; i < tagValue.length; i++) {
        if (tagValue[i] === '"') {
          inQuotes = !inQuotes;
        } else if (tagValue[i] === '-' && !inQuotes) {
          hyphenPos = i;
          break;
        }
      }
      
      // If we found a valid hyphen separator
      if (hyphenPos !== -1) {
        const groupName = tagValue.substring(0, hyphenPos).trim();
        const tagName = tagValue.substring(hyphenPos + 1).trim();
        
        // Remove quotes if they exist
        const cleanGroupName = groupName.startsWith('"') && groupName.endsWith('"') ? 
          groupName.substring(1, groupName.length - 1) : groupName;
          
        const cleanTagName = tagName.startsWith('"') && tagName.endsWith('"') ? 
          tagName.substring(1, tagName.length - 1) : tagName;
        
        return this.generateGroupTagSQL(cleanGroupName, cleanTagName);
      } else {
        // Fall back to treating it as a regular tag if no valid hyphen found
        this.parameters.push(tagValue);
        const paramIndex = this.parameters.length;
        return `i2.image_id IN (
          SELECT DISTINCT it.image_id
          FROM image_tags it
          JOIN tag t ON it.tag_id = t.tag_id
          WHERE LOWER(t.name) = $${paramIndex}
        )`;
      }
    } else {
      // Handle regular tag (no hyphen)
      // Remove quotes if they exist
      const cleanTagValue = tagValue.startsWith('"') && tagValue.endsWith('"') ? 
        tagValue.substring(1, tagValue.length - 1) : tagValue;
        
      this.parameters.push(cleanTagValue);
      const paramIndex = this.parameters.length;
      return `i2.image_id IN (
        SELECT DISTINCT it.image_id
        FROM image_tags it
        JOIN tag t ON it.tag_id = t.tag_id
        WHERE LOWER(t.name) = $${paramIndex}
      )`;
    }
  }
  
  generateGroupTagSQL(groupName, tagName) {
    // Add display_order filter if version filter is active
    const displayOrderFilter = this.hasVersionFilter ? ' AND i2.display_order = 1' : '';
    
    this.parameters.push(groupName.toLowerCase());
    this.parameters.push(tagName.toLowerCase());
    const groupParamIndex = this.parameters.length - 1;
    const tagParamIndex = this.parameters.length;
    
    return `i2.image_id IN (
      SELECT DISTINCT it.image_id
      FROM image_tags it
      JOIN tag t ON it.tag_id = t.tag_id
      JOIN tag_group tg ON t.group_id = tg.group_id
      WHERE LOWER(tg.name) = $${groupParamIndex} AND LOWER(t.name) = $${tagParamIndex}
    )`;
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
      hasVersionFilter: false,
      partialMatch: false,
      tagQueries: []
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

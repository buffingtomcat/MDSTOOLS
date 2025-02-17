import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  // Register command to sum numbers
  const sumNumbersCommand = vscode.commands.registerCommand('sqlToolkit.sumSelectedNumbers', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const text = editor.document.getText(editor.selection);
    const regex = /[+-]?\d{1,3}(\.\d{3})*(,\d+)?/g;
    let sum = 0;

    let match;
    while ((match = regex.exec(text)) !== null) {
      let numStr = match[0];
      // Remove thousand separators
      numStr = numStr.replace(/\./g, '');
      // Replace decimal comma with point
      numStr = numStr.replace(',', '.');
      
      const num = parseFloat(numStr);
      if (!isNaN(num)) {
        sum += num;
      }
    }

    vscode.window.showInformationMessage(`The sum is: ${sum}`);
  });

  // Register command to sum numbers with alternative format
  const sumNumbersAltCommand = vscode.commands.registerCommand('sqlToolkit.sumSelectedNumbersAlt', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const text = editor.document.getText(editor.selection);
    const regex = /[+-]?\d{1,3}(,\d{3})*(\.\d+)?/g;
    let sum = 0;

    let match;
    while ((match = regex.exec(text)) !== null) {
      let numStr = match[0];
      // Remove thousand separators
      numStr = numStr.replace(/,/g, '');
      // Decimal point is already in correct format
      
      const num = parseFloat(numStr);
      if (!isNaN(num)) {
        sum += num;
      }
    }

    vscode.window.showInformationMessage(`The sum is: ${sum}`);
  });

  // Register command to transform text to WHERE
  const transformToWhereCommand = vscode.commands.registerCommand('sqlToolkit.transformToWhere', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const text = editor.document.getText(editor.selection);
    const lines = text.trim().split('\n');
    if (lines.length < 2) {
      vscode.window.showErrorMessage('Selection does not contain enough data (headers and at least one data row are required).');
      return;
    }

    const headers = lines[0].trim().split(/\s+/);
    const conditions: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].trim().split(/\s+/);
      const pairs = [];
      for (let j = 0; j < headers.length; j++) {
        const col = headers[j];
        const val = values[j];
        // Simple heuristic: if it's a number, no quotes, otherwise quotes
        if (!isNaN(Number(val))) {
          pairs.push(`${col}=${val}`);
        } else {
          pairs.push(`${col}='${val}'`);
        }
      }
      conditions.push(`(${pairs.join(' AND ')})`);
    }

    const result = conditions.join('\nOR\n');

    editor.edit(editBuilder => {
      editBuilder.replace(editor.selection, result);
    }).then(() => {
      vscode.window.showInformationMessage('Text transformed to WHERE filter.');
    });
  });

  const removeDuplicatesCommand = vscode.commands.registerCommand('sqlToolkit.removeDuplicates', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor.');
        return;
    }

    const selection = editor.selection;
    // If there's no selection, we could apply to the entire document
    if (selection.isEmpty) {
        vscode.window.showInformationMessage('No text selected. Please select the text to process.');
        return;
    }

    const text = editor.document.getText(selection);

    // Split text into lines
    const lines = text.split('\n');

    // Use a Set to remove duplicates
    // If we want to ignore extra spaces, we could use line.trim()
    const uniqueLines = Array.from(new Set(lines.map(line => line.trim())));

    // Join the lines back together
    const newText = uniqueLines.join('\n');

    editor.edit(editBuilder => {
        editBuilder.replace(selection, newText);
    }).then(success => {
        if (success) {
            const diff = lines.length - uniqueLines.length;
            if (diff > 0) {
                vscode.window.showInformationMessage(`${diff} duplicate lines removed.`);
            } else {
                vscode.window.showInformationMessage('No duplicate lines found.');
            }
        } else {
            vscode.window.showErrorMessage('Could not apply text edit.');
        }
    });
});

  const sortLinesCommand = vscode.commands.registerCommand('sqlToolkit.sortLines', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor.');
      return;
    }

    const selection = editor.selection;
    if (selection.isEmpty) {
      vscode.window.showInformationMessage('Please select text to sort.');
      return;
    }

    const text = editor.document.getText(selection);
    const lines = text.split('\n');
    
    // If all non-header lines are numbers, sort numerically
    const dataLines = lines.slice(1);
    const areAllNumbers = dataLines.every(line => !isNaN(Number(line.trim())));
    
    if (areAllNumbers) {
      // Keep header, sort rest numerically
      const header = lines[0];
      const sortedData = dataLines.sort((a, b) => Number(a) - Number(b));
      const newText = [header, ...sortedData].join('\n');
      
      editor.edit(editBuilder => {
        editBuilder.replace(selection, newText);
      });
    } else {
      // Regular string sort
      const header = lines[0];
      const sortedData = dataLines.sort((a, b) => a.localeCompare(b));
      const newText = [header, ...sortedData].join('\n');
      
      editor.edit(editBuilder => {
        editBuilder.replace(selection, newText);
      });
    }
  });

  const transformToInCommand = vscode.commands.registerCommand('sqlToolkit.transformToIn', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor.');
        return;
    }

    const selection = editor.selection;
    if (selection.isEmpty) {
      vscode.window.showInformationMessage('Please select text to transform.');
      return;
    }
    
    const text = editor.document.getText(selection);
    const lines = text.trim().split('\n');

    if (lines.length === 0) {
      vscode.window.showErrorMessage('No lines found in selection.');
      return;
    }

    // Attempt to split the first line into headers, if it exists and there is more than 1 line
    let headers: string[] = [];
    let dataLines: string[] = lines;

    if (lines.length > 1) {
      headers = lines[0].trim().split(/\s+/);
      dataLines = lines.slice(1);
    }
    

    // If header exists and the header contains only 1 item, generate a IN query
    if(headers.length === 1){
      const columnName = headers[0];

      const values = dataLines.map(line => {
        const trimmedLine = line.trim();
            // Simple heuristic: if it's a number, no quotes, otherwise quotes
        if (!isNaN(Number(trimmedLine))) {
          return trimmedLine;
        } else {
          return `'${trimmedLine}'`;
        }
      });
      
      const result = `${columnName} IN (${values.join(', ')})`;
      editor.edit(editBuilder => {
          editBuilder.replace(selection, result);
      }).then(() => {
        vscode.window.showInformationMessage('Text transformed to IN filter.');
      });
    }
    else { // If the header doesn't exist or has more than 1 item, transform the selected lines into an IN query
      const values = dataLines.map(line => {
        const trimmedLine = line.trim();
            // Simple heuristic: if it's a number, no quotes, otherwise quotes
        if (!isNaN(Number(trimmedLine))) {
            return trimmedLine;
          } else {
            return `'${trimmedLine}'`;
          }
        });
        const result = `(${values.join(', ')})`;
        
        editor.edit(editBuilder => {
            editBuilder.replace(selection, result);
        }).then(() => {
            vscode.window.showInformationMessage('Text transformed to IN filter.');
        });
    }
});

const pivotDataCommand = vscode.commands.registerCommand('sqlToolkit.pivotData', () => {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
      vscode.window.showErrorMessage('No active editor.');
      return;
  }

  const selection = editor.selection;
  if (selection.isEmpty) {
      vscode.window.showInformationMessage('Please select text to pivot.');
      return;
  }

  const text = editor.document.getText(selection);
  // Limpiar retornos de carro y dividir por líneas
  const lines = text.trim().split('\n').map(line => line.trim());

  if (lines.length < 2) {
      vscode.window.showErrorMessage('Need at least headers and one data row.');
      return;
  }

  // Limpiar headers y datos usando tabulador
  const headers = lines[0].trim().split('\t').map(h => h.trim());
  const dataRows = lines.slice(1).map(line => 
      line.trim().split('\t').map(cell => cell.trim())
  );

  // Resto del código igual...
  const nameWidth = Math.max(30, ...headers.map(h => h.length)) + 2;
  const valueWidth = 30;

  // Crear separadores
  const nameColumnSeparator = '-'.repeat(nameWidth);
  const valueColumnSeparator = '-'.repeat(valueWidth);
  const separatorLine = `${nameColumnSeparator}+${Array(dataRows.length).fill(valueColumnSeparator).join('+')}`;

  // Crear header de la tabla
  let result = 'Name'.padEnd(nameWidth) + '|';
  result += dataRows.map((_, idx) => `Value #${idx + 1}`.padEnd(valueWidth)).join('|');
  result += '\n' + separatorLine + '\n';

  // Crear filas de datos
  for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      result += header.padEnd(nameWidth) + '|';
      
      // Agregar valores para cada columna
      const rowValues = dataRows.map(row => {
          const value = row[i] || '';
          return value.padEnd(valueWidth);
      });
      
      result += rowValues.join('|') + '\n';
  }

  editor.edit(editBuilder => {
      editBuilder.replace(selection, result);
  }).then(() => {
      vscode.window.showInformationMessage('Data pivoted successfully.');
  });
});

const formatTableCommand = vscode.commands.registerCommand('sqlToolkit.formatTable', () => {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
      vscode.window.showErrorMessage('No active editor.');
      return;
  }

  const selection = editor.selection;
  if (selection.isEmpty) {
      vscode.window.showInformationMessage('Please select text to format.');
      return;
  }

  const text = editor.document.getText(selection);
  const lines = text.trim().split('\n').map(line => line.trim());

  if (lines.length < 2) {
      vscode.window.showErrorMessage('Need at least headers and one data row.');
      return;
  }

  // Separar columnas usando tabulador
  const rows = lines.map(line => line.split('\t').map(cell => cell.trim()));
  const headers = rows[0];
  const dataRows = rows.slice(1);

  // Calcular ancho máximo para cada columna
  const columnWidths = headers.map((_, colIndex) => {
      return Math.max(
          headers[colIndex].length,
          ...dataRows.map(row => row[colIndex]?.length || 0)
      );
  });

  // Crear separador
  const separator = columnWidths.map(width => '-'.repeat(width)).join('-+');


  // Formatear headers
  let result = headers.map((header, index) => 
    header.padEnd(columnWidths[index])
  ).join(' |') + '\n';
  

  // Agregar línea separadora
  result += separator + '\n';

  // Formatear filas de datos
  dataRows.forEach(row => {
    const formattedRow = row.map((cell, index) => {
        // Todos los valores alineados a la derecha
        return cell.padStart(columnWidths[index]);
    });
    result += formattedRow.join(' |') + '\n';
});

  editor.edit(editBuilder => {
      editBuilder.replace(selection, result);
  });
});


  context.subscriptions.push(formatTableCommand);
  context.subscriptions.push(pivotDataCommand);
  context.subscriptions.push(transformToInCommand);
  context.subscriptions.push(sortLinesCommand);
  context.subscriptions.push(removeDuplicatesCommand);
  context.subscriptions.push(sumNumbersCommand);
  context.subscriptions.push(transformToWhereCommand);
  context.subscriptions.push(sumNumbersAltCommand);
}

export function deactivate() {}

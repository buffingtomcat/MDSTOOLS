# SQL Toolkit

**Description**

SQL Toolkit is a Visual Studio Code extension that provides several utilities to facilitate SQL development. It includes commands for performing quick calculations, transforming text into SQL clause formats, and text manipulation.

**Features**

The extension offers the following features:

1.  **Sum Selected Numbers (`sqlToolkit.sumSelectedNumbers`)**:
    *   Calculates the sum of numbers found in the current text selection.
    *   Accepts numbers formatted with periods as thousand separators and commas as decimal separators (e.g., `1.234.567,89`).

2.  **Sum Selected Numbers (Alternative Format) (`sqlToolkit.sumSelectedNumbersAlt`)**:
    *   Calculates the sum of numbers found in the current text selection.
    *   Accepts numbers formatted with commas as thousand separators and periods as decimal separators (e.g., `1,234,567.89`).

3.  **Transform to WHERE Clause (`sqlToolkit.transformToWhere`)**:
    *   Transforms a block of text, interpreted as a table, into a SQL `WHERE` clause.
    *   The first line of the selected text is considered the header (column names).
    *   Subsequent lines are considered data, and a `WHERE` clause with OR conditions is generated.
    *   String values are encapsulated with single quotes, and numeric values are not.

    *   Example:
        
        Input:
            ```
            col1 col2 col3
            123  abc  3.14
            456  def  2.71
            ```
        Output:
            ```
            (col1=123 AND col2='abc' AND col3=3.14)
            OR
            (col1=456 AND col2='def' AND col3=2.71)
            ```

4.  **Remove Duplicate Lines (`sqlToolkit.removeDuplicates`)**:
    *   Removes duplicate lines from the selected text.
    *   Duplicate lines are detected after applying a trim().

5.  **Sort Lines (`sqlToolkit.sortLines`)**:
    *   Sorts the lines of the selected text.
    *   If the lines after the header are numeric, it sorts them numerically; otherwise, it sorts them alphabetically.

6.  **Transform to IN Clause (`sqlToolkit.transformToIn`)**:
    *   Transforms the lines of the selected text into a SQL `IN` clause.
        *   If the text has a header with a single column, the output will have the format `columnName IN ('value1', 'value2'...)`.
        *   If the text has no header or the header has more than one column, the output will have the format `('value1', 'value2'...)`.
    *   Values are encapsulated with single quotes only if they are text.

    *   Example:
    
    Input:
    ```
    col1
    abc
    def
    ghi
    ```
    Output:
    ```
    col1 IN ('abc', 'def', 'ghi')
    ```
    
    Input:
    ```
    abc
    def
    ghi
    ```
    Output:
    ```
    ('abc', 'def', 'ghi')
    ```
7. **Format Table (`sqlToolkit.formatTable`)**:
   * Formats a tab-separated table with aligned columns
   * Right-aligns all data values
   * Left-aligns headers
   * Adds separator lines between headers and data

   * Example:
     Input:
     ```
     COLUMN_NAME    VALUE
     Data1    1234.56
     LongData    1.23
     ```
     Output:
     ```
     COLUMN_NAME|   VALUE
     -----------+--------
     Data1      | 1234.56
     LongData   |    1.23
     ```

8. **Pivot Data (`sqlToolkit.pivotData`)**:
   * Transforms a tab-separated table into a pivoted format
   * First column becomes row headers
   * Creates Value #N columns for each data row
   * Maintains data alignment and spacing

   * Example:
     Input:
     ```
     ID  NAME    VALUE
     1   Test1   100
     2   Test2   200
     ```
     Output:
     ```
     Name               |Value #1             |Value #2             
     -------------------+---------------------+--------------------
     ID                 |1                    |2                   
     NAME               |Test1                |Test2               
     VALUE              |100                  |200                 
     ```
**How to Use**

1.  Open a file in VS Code.
2.  Select the text to which you want to apply the feature.
3.  Open the command palette (`Ctrl+Shift+P` or `Cmd+Shift+P`).
4.  Type the name of the command (e.g., `sqlToolkit.sumSelectedNumbers`, `sqlToolkit.transformToWhere`, etc.) and press Enter.
5.  The result will be shown in the editor (in the case of `sumSelectedNumbers` and `sumSelectedNumbersAlt` in an information message, and in the case of the other commands, in the edited text).

**Dependencies**

This extension depends on:

*   Node.js (for npm and the compilation script)
*   TypeScript (for extension development)
*   VS Code (to run and use the extension)

**Configuration**

There are no additional configuration options for this extension.

**Additional Notes**

*   This extension is designed to be a simple and easy-to-use tool for common SQL and text handling tasks.
*   If you encounter errors or have suggestions, please report them on the extension's repository.

**Author**

https://github.com/buffingtomcat/

**Version**

0.0.4

/**
 * @license
 *
 * Use of this source code is governed by an MIT-style license
 */
import { Connection } from '../connection';
import { Table } from '../dbal/table';
import { Blueprint } from './blueprint';
import { SchemaGrammar } from './grammar/schema-grammar';
export declare class SchemaBuilder {
    protected connection: Connection;
    protected grammar: SchemaGrammar;
    protected resolver: Function;
    static _defaultStringLength: number;
    static _defaultMorphKeyType: string;
    constructor(connection: Connection);
    static defaultStringLength(length: number): void;
    static defaultMorphKeyType(type: string): void;
    static morphUsingUuids(): void;
    createDatabase(name: string): void;
    dropDatabaseIfExists(name: string): void;
    hasTable(table: string): Promise<boolean>;
    hasColumn(table: string, column: string): Promise<boolean>;
    hasColumns(table: string, columns: any[]): Promise<boolean>;
    getColumnType(table: string, column: string): Promise<void>;
    getColumnListing(table: string): Promise<string[]>;
    table(table: string, callback: (bp: Blueprint) => void): Promise<void>;
    create(table: string, callback: (table: Blueprint) => void): Promise<void>;
    drop(table: string): Promise<void>;
    dropIfExists(table: string): Promise<void>;
    dropColumns(table: string, columns: string | any[]): Promise<void>;
    dropAllTables(): void;
    dropAllViews(): void;
    dropAllTypes(): void;
    getAllTables(): void;
    rename(from: string, to: string): void;
    enableForeignKeyConstraints(): Promise<any>;
    disableForeignKeyConstraints(): Promise<any>;
    protected build(blueprint: Blueprint): Promise<void>;
    protected _getPortableDatabasesList(databases: any[]): any[];
    protected getPortableNamespacesList(namespaces: string[]): string[];
    protected _getPortableDatabaseDefinition(database: any): any;
    protected getPortableNamespaceDefinition(namespace: string): string;
    protected _getPortableFunctionsList(functions: any[][]): any[][];
    protected _getPortableFunctionDefinition(func: any[]): any[];
    protected _getPortableTriggersList(triggers: any[][]): any[][];
    protected _getPortableTriggerDefinition(trigger: any[]): any[];
    protected _getPortableSequencesList(sequences: any[][]): void[];
    protected _getPortableSequenceDefinition(sequence: any[]): void;
    protected _getPortableTableColumnList(
        table: string,
        database: string,
        tableColumns: any[][]
    ): any[];
    protected _getPortableTableColumnDefinition(tableColumn: any): any;
    protected _getPortableTableIndexesList(
        tableIndexRows: any[],
        tableName?: string | null
    ): Record<string, any>;
    protected _getPortableTablesList(tables: any[]): any[];
    protected _getPortableTableDefinition(table: any): any;
    protected _getPortableUsersList(users: any[][]): any[][];
    protected _getPortableUserDefinition(user: string[]): string[];
    protected _getPortableViewDefinition(view: any[]): boolean;
    listDatabases(): Promise<any[]>;
    listNamespaceNames(): Promise<string[]>;
    listSequences(database?: string | null): Promise<any[]>;
    listTableColumns(table: string, database?: string): Promise<any[]>;
    listTableIndexes(table: string): Promise<Record<string, any>>;
    tablesExist(tableNames: string | string[]): Promise<boolean>;
    listTableNames(): Promise<any[]>;
    protected filterAssetNames(assetNames: any[]): any[];
    protected getFilterSchemaAssetsExpression(): any;
    listTables(): Promise<Promise<Table>[]>;
    listTableDetails(tableName: string): Promise<Table>;
    listTableForeignKeys(
        table: string,
        database?: string | null
    ): Promise<any[]>;
    protected _getPortableTableForeignKeysList(
        tableForeignKeys: any[][]
    ): any[];
    protected _getPortableTableForeignKeyDefinition(tableForeignKey: any): any;
    protected createBlueprint(table: string, callback?: Function | null): any;
    registerCustomDoctrineType(clazz: string, name: string, type: string): void;
    getConnection(): Connection;
    setConnection(connection: Connection): this;
    blueprintResolver(resolver: Function): void;
}

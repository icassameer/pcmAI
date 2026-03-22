import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import type { BusinessProfile, Category, CreateCategoryRequest, CreateCustomerRequest, CreateProductRequest, CreatePurchaseRequest, CreateSaleRequest, CreateSupplierRequest, CreateUserRequest, Customer, DashboardStats, ErrorResponse, GetGstSummaryReportParams, GetInventoryReportParams, GetPurchaseSummaryReportParams, GetSalesSummaryReportParams, GstSummaryReport, HealthStatus, InventoryReport, ListCustomersParams, ListProductsParams, ListPurchasesParams, ListSalesParams, ListSuppliersParams, ListUsersParams, LoginRequest, LoginResponse, PaginatedCustomers, PaginatedProducts, PaginatedPurchases, PaginatedSales, PaginatedSuppliers, PaginatedUsers, Product, Purchase, PurchaseDetail, PurchaseSummaryReport, RecentTransaction, RefreshRequest, Sale, SaleDetail, SalesSummaryReport, SalesTrendPoint, SuccessResponse, Supplier, TopProduct, UpdateBusinessRequest, UpdateProductRequest, UpdatePurchaseRequest, UpdateSaleRequest, UpdateUserRequest, User } from "./api.schemas";
import { customFetch } from "../custom-fetch";
import type { ErrorType, BodyType } from "../custom-fetch";
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
/**
 * @summary Health check
 */
export declare const getHealthCheckUrl: () => string;
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Login
 */
export declare const getLoginUrl: () => string;
export declare const login: (loginRequest: LoginRequest, options?: RequestInit) => Promise<LoginResponse>;
export declare const getLoginMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof login>>, TError, {
        data: BodyType<LoginRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof login>>, TError, {
    data: BodyType<LoginRequest>;
}, TContext>;
export type LoginMutationResult = NonNullable<Awaited<ReturnType<typeof login>>>;
export type LoginMutationBody = BodyType<LoginRequest>;
export type LoginMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Login
 */
export declare const useLogin: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof login>>, TError, {
        data: BodyType<LoginRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof login>>, TError, {
    data: BodyType<LoginRequest>;
}, TContext>;
/**
 * @summary Refresh access token
 */
export declare const getRefreshTokenUrl: () => string;
export declare const refreshToken: (refreshRequest: RefreshRequest, options?: RequestInit) => Promise<LoginResponse>;
export declare const getRefreshTokenMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof refreshToken>>, TError, {
        data: BodyType<RefreshRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof refreshToken>>, TError, {
    data: BodyType<RefreshRequest>;
}, TContext>;
export type RefreshTokenMutationResult = NonNullable<Awaited<ReturnType<typeof refreshToken>>>;
export type RefreshTokenMutationBody = BodyType<RefreshRequest>;
export type RefreshTokenMutationError = ErrorType<unknown>;
/**
 * @summary Refresh access token
 */
export declare const useRefreshToken: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof refreshToken>>, TError, {
        data: BodyType<RefreshRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof refreshToken>>, TError, {
    data: BodyType<RefreshRequest>;
}, TContext>;
/**
 * @summary Logout
 */
export declare const getLogoutUrl: () => string;
export declare const logout: (options?: RequestInit) => Promise<SuccessResponse>;
export declare const getLogoutMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
export type LogoutMutationResult = NonNullable<Awaited<ReturnType<typeof logout>>>;
export type LogoutMutationError = ErrorType<unknown>;
/**
 * @summary Logout
 */
export declare const useLogout: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
/**
 * @summary Get current user
 */
export declare const getGetMeUrl: () => string;
export declare const getMe: (options?: RequestInit) => Promise<User>;
export declare const getGetMeQueryKey: () => readonly ["/api/auth/me"];
export declare const getGetMeQueryOptions: <TData = Awaited<ReturnType<typeof getMe>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMe>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getMe>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetMeQueryResult = NonNullable<Awaited<ReturnType<typeof getMe>>>;
export type GetMeQueryError = ErrorType<unknown>;
/**
 * @summary Get current user
 */
export declare function useGetMe<TData = Awaited<ReturnType<typeof getMe>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMe>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary List users
 */
export declare const getListUsersUrl: (params?: ListUsersParams) => string;
export declare const listUsers: (params?: ListUsersParams, options?: RequestInit) => Promise<PaginatedUsers>;
export declare const getListUsersQueryKey: (params?: ListUsersParams) => readonly ["/api/users", ...ListUsersParams[]];
export declare const getListUsersQueryOptions: <TData = Awaited<ReturnType<typeof listUsers>>, TError = ErrorType<unknown>>(params?: ListUsersParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listUsers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listUsers>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListUsersQueryResult = NonNullable<Awaited<ReturnType<typeof listUsers>>>;
export type ListUsersQueryError = ErrorType<unknown>;
/**
 * @summary List users
 */
export declare function useListUsers<TData = Awaited<ReturnType<typeof listUsers>>, TError = ErrorType<unknown>>(params?: ListUsersParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listUsers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create user
 */
export declare const getCreateUserUrl: () => string;
export declare const createUser: (createUserRequest: CreateUserRequest, options?: RequestInit) => Promise<User>;
export declare const getCreateUserMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createUser>>, TError, {
        data: BodyType<CreateUserRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createUser>>, TError, {
    data: BodyType<CreateUserRequest>;
}, TContext>;
export type CreateUserMutationResult = NonNullable<Awaited<ReturnType<typeof createUser>>>;
export type CreateUserMutationBody = BodyType<CreateUserRequest>;
export type CreateUserMutationError = ErrorType<unknown>;
/**
 * @summary Create user
 */
export declare const useCreateUser: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createUser>>, TError, {
        data: BodyType<CreateUserRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createUser>>, TError, {
    data: BodyType<CreateUserRequest>;
}, TContext>;
/**
 * @summary Get user
 */
export declare const getGetUserUrl: (id: number) => string;
export declare const getUser: (id: number, options?: RequestInit) => Promise<User>;
export declare const getGetUserQueryKey: (id: number) => readonly [`/api/users/${number}`];
export declare const getGetUserQueryOptions: <TData = Awaited<ReturnType<typeof getUser>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getUser>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getUser>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetUserQueryResult = NonNullable<Awaited<ReturnType<typeof getUser>>>;
export type GetUserQueryError = ErrorType<unknown>;
/**
 * @summary Get user
 */
export declare function useGetUser<TData = Awaited<ReturnType<typeof getUser>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getUser>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Update user
 */
export declare const getUpdateUserUrl: (id: number) => string;
export declare const updateUser: (id: number, updateUserRequest: UpdateUserRequest, options?: RequestInit) => Promise<User>;
export declare const getUpdateUserMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateUser>>, TError, {
        id: number;
        data: BodyType<UpdateUserRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateUser>>, TError, {
    id: number;
    data: BodyType<UpdateUserRequest>;
}, TContext>;
export type UpdateUserMutationResult = NonNullable<Awaited<ReturnType<typeof updateUser>>>;
export type UpdateUserMutationBody = BodyType<UpdateUserRequest>;
export type UpdateUserMutationError = ErrorType<unknown>;
/**
 * @summary Update user
 */
export declare const useUpdateUser: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateUser>>, TError, {
        id: number;
        data: BodyType<UpdateUserRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateUser>>, TError, {
    id: number;
    data: BodyType<UpdateUserRequest>;
}, TContext>;
/**
 * @summary Delete user
 */
export declare const getDeleteUserUrl: (id: number) => string;
export declare const deleteUser: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteUserMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteUser>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteUser>>, TError, {
    id: number;
}, TContext>;
export type DeleteUserMutationResult = NonNullable<Awaited<ReturnType<typeof deleteUser>>>;
export type DeleteUserMutationError = ErrorType<unknown>;
/**
 * @summary Delete user
 */
export declare const useDeleteUser: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteUser>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteUser>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary List categories
 */
export declare const getListCategoriesUrl: () => string;
export declare const listCategories: (options?: RequestInit) => Promise<Category[]>;
export declare const getListCategoriesQueryKey: () => readonly ["/api/categories"];
export declare const getListCategoriesQueryOptions: <TData = Awaited<ReturnType<typeof listCategories>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listCategories>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listCategories>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListCategoriesQueryResult = NonNullable<Awaited<ReturnType<typeof listCategories>>>;
export type ListCategoriesQueryError = ErrorType<unknown>;
/**
 * @summary List categories
 */
export declare function useListCategories<TData = Awaited<ReturnType<typeof listCategories>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listCategories>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create category
 */
export declare const getCreateCategoryUrl: () => string;
export declare const createCategory: (createCategoryRequest: CreateCategoryRequest, options?: RequestInit) => Promise<Category>;
export declare const getCreateCategoryMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createCategory>>, TError, {
        data: BodyType<CreateCategoryRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createCategory>>, TError, {
    data: BodyType<CreateCategoryRequest>;
}, TContext>;
export type CreateCategoryMutationResult = NonNullable<Awaited<ReturnType<typeof createCategory>>>;
export type CreateCategoryMutationBody = BodyType<CreateCategoryRequest>;
export type CreateCategoryMutationError = ErrorType<unknown>;
/**
 * @summary Create category
 */
export declare const useCreateCategory: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createCategory>>, TError, {
        data: BodyType<CreateCategoryRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createCategory>>, TError, {
    data: BodyType<CreateCategoryRequest>;
}, TContext>;
/**
 * @summary Update category
 */
export declare const getUpdateCategoryUrl: (id: number) => string;
export declare const updateCategory: (id: number, createCategoryRequest: CreateCategoryRequest, options?: RequestInit) => Promise<Category>;
export declare const getUpdateCategoryMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateCategory>>, TError, {
        id: number;
        data: BodyType<CreateCategoryRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateCategory>>, TError, {
    id: number;
    data: BodyType<CreateCategoryRequest>;
}, TContext>;
export type UpdateCategoryMutationResult = NonNullable<Awaited<ReturnType<typeof updateCategory>>>;
export type UpdateCategoryMutationBody = BodyType<CreateCategoryRequest>;
export type UpdateCategoryMutationError = ErrorType<unknown>;
/**
 * @summary Update category
 */
export declare const useUpdateCategory: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateCategory>>, TError, {
        id: number;
        data: BodyType<CreateCategoryRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateCategory>>, TError, {
    id: number;
    data: BodyType<CreateCategoryRequest>;
}, TContext>;
/**
 * @summary Delete category
 */
export declare const getDeleteCategoryUrl: (id: number) => string;
export declare const deleteCategory: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteCategoryMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteCategory>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteCategory>>, TError, {
    id: number;
}, TContext>;
export type DeleteCategoryMutationResult = NonNullable<Awaited<ReturnType<typeof deleteCategory>>>;
export type DeleteCategoryMutationError = ErrorType<unknown>;
/**
 * @summary Delete category
 */
export declare const useDeleteCategory: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteCategory>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteCategory>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary List products
 */
export declare const getListProductsUrl: (params?: ListProductsParams) => string;
export declare const listProducts: (params?: ListProductsParams, options?: RequestInit) => Promise<PaginatedProducts>;
export declare const getListProductsQueryKey: (params?: ListProductsParams) => readonly ["/api/products", ...ListProductsParams[]];
export declare const getListProductsQueryOptions: <TData = Awaited<ReturnType<typeof listProducts>>, TError = ErrorType<unknown>>(params?: ListProductsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listProducts>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listProducts>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListProductsQueryResult = NonNullable<Awaited<ReturnType<typeof listProducts>>>;
export type ListProductsQueryError = ErrorType<unknown>;
/**
 * @summary List products
 */
export declare function useListProducts<TData = Awaited<ReturnType<typeof listProducts>>, TError = ErrorType<unknown>>(params?: ListProductsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listProducts>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create product
 */
export declare const getCreateProductUrl: () => string;
export declare const createProduct: (createProductRequest: CreateProductRequest, options?: RequestInit) => Promise<Product>;
export declare const getCreateProductMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createProduct>>, TError, {
        data: BodyType<CreateProductRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createProduct>>, TError, {
    data: BodyType<CreateProductRequest>;
}, TContext>;
export type CreateProductMutationResult = NonNullable<Awaited<ReturnType<typeof createProduct>>>;
export type CreateProductMutationBody = BodyType<CreateProductRequest>;
export type CreateProductMutationError = ErrorType<unknown>;
/**
 * @summary Create product
 */
export declare const useCreateProduct: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createProduct>>, TError, {
        data: BodyType<CreateProductRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createProduct>>, TError, {
    data: BodyType<CreateProductRequest>;
}, TContext>;
/**
 * @summary Get product
 */
export declare const getGetProductUrl: (id: number) => string;
export declare const getProduct: (id: number, options?: RequestInit) => Promise<Product>;
export declare const getGetProductQueryKey: (id: number) => readonly [`/api/products/${number}`];
export declare const getGetProductQueryOptions: <TData = Awaited<ReturnType<typeof getProduct>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getProduct>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getProduct>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetProductQueryResult = NonNullable<Awaited<ReturnType<typeof getProduct>>>;
export type GetProductQueryError = ErrorType<unknown>;
/**
 * @summary Get product
 */
export declare function useGetProduct<TData = Awaited<ReturnType<typeof getProduct>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getProduct>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Update product
 */
export declare const getUpdateProductUrl: (id: number) => string;
export declare const updateProduct: (id: number, updateProductRequest: UpdateProductRequest, options?: RequestInit) => Promise<Product>;
export declare const getUpdateProductMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateProduct>>, TError, {
        id: number;
        data: BodyType<UpdateProductRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateProduct>>, TError, {
    id: number;
    data: BodyType<UpdateProductRequest>;
}, TContext>;
export type UpdateProductMutationResult = NonNullable<Awaited<ReturnType<typeof updateProduct>>>;
export type UpdateProductMutationBody = BodyType<UpdateProductRequest>;
export type UpdateProductMutationError = ErrorType<unknown>;
/**
 * @summary Update product
 */
export declare const useUpdateProduct: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateProduct>>, TError, {
        id: number;
        data: BodyType<UpdateProductRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateProduct>>, TError, {
    id: number;
    data: BodyType<UpdateProductRequest>;
}, TContext>;
/**
 * @summary Delete product
 */
export declare const getDeleteProductUrl: (id: number) => string;
export declare const deleteProduct: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteProductMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteProduct>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteProduct>>, TError, {
    id: number;
}, TContext>;
export type DeleteProductMutationResult = NonNullable<Awaited<ReturnType<typeof deleteProduct>>>;
export type DeleteProductMutationError = ErrorType<unknown>;
/**
 * @summary Delete product
 */
export declare const useDeleteProduct: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteProduct>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteProduct>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary List suppliers
 */
export declare const getListSuppliersUrl: (params?: ListSuppliersParams) => string;
export declare const listSuppliers: (params?: ListSuppliersParams, options?: RequestInit) => Promise<PaginatedSuppliers>;
export declare const getListSuppliersQueryKey: (params?: ListSuppliersParams) => readonly ["/api/suppliers", ...ListSuppliersParams[]];
export declare const getListSuppliersQueryOptions: <TData = Awaited<ReturnType<typeof listSuppliers>>, TError = ErrorType<unknown>>(params?: ListSuppliersParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listSuppliers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listSuppliers>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListSuppliersQueryResult = NonNullable<Awaited<ReturnType<typeof listSuppliers>>>;
export type ListSuppliersQueryError = ErrorType<unknown>;
/**
 * @summary List suppliers
 */
export declare function useListSuppliers<TData = Awaited<ReturnType<typeof listSuppliers>>, TError = ErrorType<unknown>>(params?: ListSuppliersParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listSuppliers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create supplier
 */
export declare const getCreateSupplierUrl: () => string;
export declare const createSupplier: (createSupplierRequest: CreateSupplierRequest, options?: RequestInit) => Promise<Supplier>;
export declare const getCreateSupplierMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createSupplier>>, TError, {
        data: BodyType<CreateSupplierRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createSupplier>>, TError, {
    data: BodyType<CreateSupplierRequest>;
}, TContext>;
export type CreateSupplierMutationResult = NonNullable<Awaited<ReturnType<typeof createSupplier>>>;
export type CreateSupplierMutationBody = BodyType<CreateSupplierRequest>;
export type CreateSupplierMutationError = ErrorType<unknown>;
/**
 * @summary Create supplier
 */
export declare const useCreateSupplier: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createSupplier>>, TError, {
        data: BodyType<CreateSupplierRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createSupplier>>, TError, {
    data: BodyType<CreateSupplierRequest>;
}, TContext>;
/**
 * @summary Get supplier
 */
export declare const getGetSupplierUrl: (id: number) => string;
export declare const getSupplier: (id: number, options?: RequestInit) => Promise<Supplier>;
export declare const getGetSupplierQueryKey: (id: number) => readonly [`/api/suppliers/${number}`];
export declare const getGetSupplierQueryOptions: <TData = Awaited<ReturnType<typeof getSupplier>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSupplier>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getSupplier>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetSupplierQueryResult = NonNullable<Awaited<ReturnType<typeof getSupplier>>>;
export type GetSupplierQueryError = ErrorType<unknown>;
/**
 * @summary Get supplier
 */
export declare function useGetSupplier<TData = Awaited<ReturnType<typeof getSupplier>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSupplier>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Update supplier
 */
export declare const getUpdateSupplierUrl: (id: number) => string;
export declare const updateSupplier: (id: number, createSupplierRequest: CreateSupplierRequest, options?: RequestInit) => Promise<Supplier>;
export declare const getUpdateSupplierMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateSupplier>>, TError, {
        id: number;
        data: BodyType<CreateSupplierRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateSupplier>>, TError, {
    id: number;
    data: BodyType<CreateSupplierRequest>;
}, TContext>;
export type UpdateSupplierMutationResult = NonNullable<Awaited<ReturnType<typeof updateSupplier>>>;
export type UpdateSupplierMutationBody = BodyType<CreateSupplierRequest>;
export type UpdateSupplierMutationError = ErrorType<unknown>;
/**
 * @summary Update supplier
 */
export declare const useUpdateSupplier: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateSupplier>>, TError, {
        id: number;
        data: BodyType<CreateSupplierRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateSupplier>>, TError, {
    id: number;
    data: BodyType<CreateSupplierRequest>;
}, TContext>;
/**
 * @summary Delete supplier
 */
export declare const getDeleteSupplierUrl: (id: number) => string;
export declare const deleteSupplier: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteSupplierMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteSupplier>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteSupplier>>, TError, {
    id: number;
}, TContext>;
export type DeleteSupplierMutationResult = NonNullable<Awaited<ReturnType<typeof deleteSupplier>>>;
export type DeleteSupplierMutationError = ErrorType<unknown>;
/**
 * @summary Delete supplier
 */
export declare const useDeleteSupplier: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteSupplier>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteSupplier>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary List customers
 */
export declare const getListCustomersUrl: (params?: ListCustomersParams) => string;
export declare const listCustomers: (params?: ListCustomersParams, options?: RequestInit) => Promise<PaginatedCustomers>;
export declare const getListCustomersQueryKey: (params?: ListCustomersParams) => readonly ["/api/customers", ...ListCustomersParams[]];
export declare const getListCustomersQueryOptions: <TData = Awaited<ReturnType<typeof listCustomers>>, TError = ErrorType<unknown>>(params?: ListCustomersParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listCustomers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listCustomers>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListCustomersQueryResult = NonNullable<Awaited<ReturnType<typeof listCustomers>>>;
export type ListCustomersQueryError = ErrorType<unknown>;
/**
 * @summary List customers
 */
export declare function useListCustomers<TData = Awaited<ReturnType<typeof listCustomers>>, TError = ErrorType<unknown>>(params?: ListCustomersParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listCustomers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create customer
 */
export declare const getCreateCustomerUrl: () => string;
export declare const createCustomer: (createCustomerRequest: CreateCustomerRequest, options?: RequestInit) => Promise<Customer>;
export declare const getCreateCustomerMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createCustomer>>, TError, {
        data: BodyType<CreateCustomerRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createCustomer>>, TError, {
    data: BodyType<CreateCustomerRequest>;
}, TContext>;
export type CreateCustomerMutationResult = NonNullable<Awaited<ReturnType<typeof createCustomer>>>;
export type CreateCustomerMutationBody = BodyType<CreateCustomerRequest>;
export type CreateCustomerMutationError = ErrorType<unknown>;
/**
 * @summary Create customer
 */
export declare const useCreateCustomer: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createCustomer>>, TError, {
        data: BodyType<CreateCustomerRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createCustomer>>, TError, {
    data: BodyType<CreateCustomerRequest>;
}, TContext>;
/**
 * @summary Get customer
 */
export declare const getGetCustomerUrl: (id: number) => string;
export declare const getCustomer: (id: number, options?: RequestInit) => Promise<Customer>;
export declare const getGetCustomerQueryKey: (id: number) => readonly [`/api/customers/${number}`];
export declare const getGetCustomerQueryOptions: <TData = Awaited<ReturnType<typeof getCustomer>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCustomer>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getCustomer>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetCustomerQueryResult = NonNullable<Awaited<ReturnType<typeof getCustomer>>>;
export type GetCustomerQueryError = ErrorType<unknown>;
/**
 * @summary Get customer
 */
export declare function useGetCustomer<TData = Awaited<ReturnType<typeof getCustomer>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCustomer>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Update customer
 */
export declare const getUpdateCustomerUrl: (id: number) => string;
export declare const updateCustomer: (id: number, createCustomerRequest: CreateCustomerRequest, options?: RequestInit) => Promise<Customer>;
export declare const getUpdateCustomerMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateCustomer>>, TError, {
        id: number;
        data: BodyType<CreateCustomerRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateCustomer>>, TError, {
    id: number;
    data: BodyType<CreateCustomerRequest>;
}, TContext>;
export type UpdateCustomerMutationResult = NonNullable<Awaited<ReturnType<typeof updateCustomer>>>;
export type UpdateCustomerMutationBody = BodyType<CreateCustomerRequest>;
export type UpdateCustomerMutationError = ErrorType<unknown>;
/**
 * @summary Update customer
 */
export declare const useUpdateCustomer: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateCustomer>>, TError, {
        id: number;
        data: BodyType<CreateCustomerRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateCustomer>>, TError, {
    id: number;
    data: BodyType<CreateCustomerRequest>;
}, TContext>;
/**
 * @summary Delete customer
 */
export declare const getDeleteCustomerUrl: (id: number) => string;
export declare const deleteCustomer: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteCustomerMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteCustomer>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteCustomer>>, TError, {
    id: number;
}, TContext>;
export type DeleteCustomerMutationResult = NonNullable<Awaited<ReturnType<typeof deleteCustomer>>>;
export type DeleteCustomerMutationError = ErrorType<unknown>;
/**
 * @summary Delete customer
 */
export declare const useDeleteCustomer: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteCustomer>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteCustomer>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary List purchases
 */
export declare const getListPurchasesUrl: (params?: ListPurchasesParams) => string;
export declare const listPurchases: (params?: ListPurchasesParams, options?: RequestInit) => Promise<PaginatedPurchases>;
export declare const getListPurchasesQueryKey: (params?: ListPurchasesParams) => readonly ["/api/purchases", ...ListPurchasesParams[]];
export declare const getListPurchasesQueryOptions: <TData = Awaited<ReturnType<typeof listPurchases>>, TError = ErrorType<unknown>>(params?: ListPurchasesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listPurchases>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listPurchases>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListPurchasesQueryResult = NonNullable<Awaited<ReturnType<typeof listPurchases>>>;
export type ListPurchasesQueryError = ErrorType<unknown>;
/**
 * @summary List purchases
 */
export declare function useListPurchases<TData = Awaited<ReturnType<typeof listPurchases>>, TError = ErrorType<unknown>>(params?: ListPurchasesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listPurchases>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create purchase
 */
export declare const getCreatePurchaseUrl: () => string;
export declare const createPurchase: (createPurchaseRequest: CreatePurchaseRequest, options?: RequestInit) => Promise<Purchase>;
export declare const getCreatePurchaseMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createPurchase>>, TError, {
        data: BodyType<CreatePurchaseRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createPurchase>>, TError, {
    data: BodyType<CreatePurchaseRequest>;
}, TContext>;
export type CreatePurchaseMutationResult = NonNullable<Awaited<ReturnType<typeof createPurchase>>>;
export type CreatePurchaseMutationBody = BodyType<CreatePurchaseRequest>;
export type CreatePurchaseMutationError = ErrorType<unknown>;
/**
 * @summary Create purchase
 */
export declare const useCreatePurchase: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createPurchase>>, TError, {
        data: BodyType<CreatePurchaseRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createPurchase>>, TError, {
    data: BodyType<CreatePurchaseRequest>;
}, TContext>;
/**
 * @summary Get purchase
 */
export declare const getGetPurchaseUrl: (id: number) => string;
export declare const getPurchase: (id: number, options?: RequestInit) => Promise<PurchaseDetail>;
export declare const getGetPurchaseQueryKey: (id: number) => readonly [`/api/purchases/${number}`];
export declare const getGetPurchaseQueryOptions: <TData = Awaited<ReturnType<typeof getPurchase>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPurchase>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getPurchase>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetPurchaseQueryResult = NonNullable<Awaited<ReturnType<typeof getPurchase>>>;
export type GetPurchaseQueryError = ErrorType<unknown>;
/**
 * @summary Get purchase
 */
export declare function useGetPurchase<TData = Awaited<ReturnType<typeof getPurchase>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPurchase>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Update purchase
 */
export declare const getUpdatePurchaseUrl: (id: number) => string;
export declare const updatePurchase: (id: number, updatePurchaseRequest: UpdatePurchaseRequest, options?: RequestInit) => Promise<Purchase>;
export declare const getUpdatePurchaseMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updatePurchase>>, TError, {
        id: number;
        data: BodyType<UpdatePurchaseRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updatePurchase>>, TError, {
    id: number;
    data: BodyType<UpdatePurchaseRequest>;
}, TContext>;
export type UpdatePurchaseMutationResult = NonNullable<Awaited<ReturnType<typeof updatePurchase>>>;
export type UpdatePurchaseMutationBody = BodyType<UpdatePurchaseRequest>;
export type UpdatePurchaseMutationError = ErrorType<unknown>;
/**
 * @summary Update purchase
 */
export declare const useUpdatePurchase: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updatePurchase>>, TError, {
        id: number;
        data: BodyType<UpdatePurchaseRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updatePurchase>>, TError, {
    id: number;
    data: BodyType<UpdatePurchaseRequest>;
}, TContext>;
/**
 * @summary Delete purchase
 */
export declare const getDeletePurchaseUrl: (id: number) => string;
export declare const deletePurchase: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeletePurchaseMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deletePurchase>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deletePurchase>>, TError, {
    id: number;
}, TContext>;
export type DeletePurchaseMutationResult = NonNullable<Awaited<ReturnType<typeof deletePurchase>>>;
export type DeletePurchaseMutationError = ErrorType<unknown>;
/**
 * @summary Delete purchase
 */
export declare const useDeletePurchase: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deletePurchase>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deletePurchase>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary List sales
 */
export declare const getListSalesUrl: (params?: ListSalesParams) => string;
export declare const listSales: (params?: ListSalesParams, options?: RequestInit) => Promise<PaginatedSales>;
export declare const getListSalesQueryKey: (params?: ListSalesParams) => readonly ["/api/sales", ...ListSalesParams[]];
export declare const getListSalesQueryOptions: <TData = Awaited<ReturnType<typeof listSales>>, TError = ErrorType<unknown>>(params?: ListSalesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listSales>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listSales>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListSalesQueryResult = NonNullable<Awaited<ReturnType<typeof listSales>>>;
export type ListSalesQueryError = ErrorType<unknown>;
/**
 * @summary List sales
 */
export declare function useListSales<TData = Awaited<ReturnType<typeof listSales>>, TError = ErrorType<unknown>>(params?: ListSalesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listSales>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create sale
 */
export declare const getCreateSaleUrl: () => string;
export declare const createSale: (createSaleRequest: CreateSaleRequest, options?: RequestInit) => Promise<Sale>;
export declare const getCreateSaleMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createSale>>, TError, {
        data: BodyType<CreateSaleRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createSale>>, TError, {
    data: BodyType<CreateSaleRequest>;
}, TContext>;
export type CreateSaleMutationResult = NonNullable<Awaited<ReturnType<typeof createSale>>>;
export type CreateSaleMutationBody = BodyType<CreateSaleRequest>;
export type CreateSaleMutationError = ErrorType<unknown>;
/**
 * @summary Create sale
 */
export declare const useCreateSale: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createSale>>, TError, {
        data: BodyType<CreateSaleRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createSale>>, TError, {
    data: BodyType<CreateSaleRequest>;
}, TContext>;
/**
 * @summary Get sale
 */
export declare const getGetSaleUrl: (id: number) => string;
export declare const getSale: (id: number, options?: RequestInit) => Promise<SaleDetail>;
export declare const getGetSaleQueryKey: (id: number) => readonly [`/api/sales/${number}`];
export declare const getGetSaleQueryOptions: <TData = Awaited<ReturnType<typeof getSale>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSale>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getSale>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetSaleQueryResult = NonNullable<Awaited<ReturnType<typeof getSale>>>;
export type GetSaleQueryError = ErrorType<unknown>;
/**
 * @summary Get sale
 */
export declare function useGetSale<TData = Awaited<ReturnType<typeof getSale>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSale>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Update sale
 */
export declare const getUpdateSaleUrl: (id: number) => string;
export declare const updateSale: (id: number, updateSaleRequest: UpdateSaleRequest, options?: RequestInit) => Promise<Sale>;
export declare const getUpdateSaleMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateSale>>, TError, {
        id: number;
        data: BodyType<UpdateSaleRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateSale>>, TError, {
    id: number;
    data: BodyType<UpdateSaleRequest>;
}, TContext>;
export type UpdateSaleMutationResult = NonNullable<Awaited<ReturnType<typeof updateSale>>>;
export type UpdateSaleMutationBody = BodyType<UpdateSaleRequest>;
export type UpdateSaleMutationError = ErrorType<unknown>;
/**
 * @summary Update sale
 */
export declare const useUpdateSale: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateSale>>, TError, {
        id: number;
        data: BodyType<UpdateSaleRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateSale>>, TError, {
    id: number;
    data: BodyType<UpdateSaleRequest>;
}, TContext>;
/**
 * @summary Delete sale
 */
export declare const getDeleteSaleUrl: (id: number) => string;
export declare const deleteSale: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteSaleMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteSale>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteSale>>, TError, {
    id: number;
}, TContext>;
export type DeleteSaleMutationResult = NonNullable<Awaited<ReturnType<typeof deleteSale>>>;
export type DeleteSaleMutationError = ErrorType<unknown>;
/**
 * @summary Delete sale
 */
export declare const useDeleteSale: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteSale>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteSale>>, TError, {
    id: number;
}, TContext>;
/**
 * @summary Download sale invoice as PDF
 */
export declare const getGetSaleInvoicePdfUrl: (id: number) => string;
export declare const getSaleInvoicePdf: (id: number, options?: RequestInit) => Promise<Blob>;
export declare const getGetSaleInvoicePdfQueryKey: (id: number) => readonly [`/api/sales/${number}/invoice-pdf`];
export declare const getGetSaleInvoicePdfQueryOptions: <TData = Awaited<ReturnType<typeof getSaleInvoicePdf>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSaleInvoicePdf>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getSaleInvoicePdf>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetSaleInvoicePdfQueryResult = NonNullable<Awaited<ReturnType<typeof getSaleInvoicePdf>>>;
export type GetSaleInvoicePdfQueryError = ErrorType<unknown>;
/**
 * @summary Download sale invoice as PDF
 */
export declare function useGetSaleInvoicePdf<TData = Awaited<ReturnType<typeof getSaleInvoicePdf>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSaleInvoicePdf>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get dashboard statistics
 */
export declare const getGetDashboardStatsUrl: () => string;
export declare const getDashboardStats: (options?: RequestInit) => Promise<DashboardStats>;
export declare const getGetDashboardStatsQueryKey: () => readonly ["/api/dashboard/stats"];
export declare const getGetDashboardStatsQueryOptions: <TData = Awaited<ReturnType<typeof getDashboardStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDashboardStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getDashboardStats>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetDashboardStatsQueryResult = NonNullable<Awaited<ReturnType<typeof getDashboardStats>>>;
export type GetDashboardStatsQueryError = ErrorType<unknown>;
/**
 * @summary Get dashboard statistics
 */
export declare function useGetDashboardStats<TData = Awaited<ReturnType<typeof getDashboardStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDashboardStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get sales trend for last 30 days
 */
export declare const getGetSalesTrendUrl: () => string;
export declare const getSalesTrend: (options?: RequestInit) => Promise<SalesTrendPoint[]>;
export declare const getGetSalesTrendQueryKey: () => readonly ["/api/dashboard/sales-trend"];
export declare const getGetSalesTrendQueryOptions: <TData = Awaited<ReturnType<typeof getSalesTrend>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSalesTrend>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getSalesTrend>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetSalesTrendQueryResult = NonNullable<Awaited<ReturnType<typeof getSalesTrend>>>;
export type GetSalesTrendQueryError = ErrorType<unknown>;
/**
 * @summary Get sales trend for last 30 days
 */
export declare function useGetSalesTrend<TData = Awaited<ReturnType<typeof getSalesTrend>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSalesTrend>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get top selling products
 */
export declare const getGetTopProductsUrl: () => string;
export declare const getTopProducts: (options?: RequestInit) => Promise<TopProduct[]>;
export declare const getGetTopProductsQueryKey: () => readonly ["/api/dashboard/top-products"];
export declare const getGetTopProductsQueryOptions: <TData = Awaited<ReturnType<typeof getTopProducts>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getTopProducts>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getTopProducts>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetTopProductsQueryResult = NonNullable<Awaited<ReturnType<typeof getTopProducts>>>;
export type GetTopProductsQueryError = ErrorType<unknown>;
/**
 * @summary Get top selling products
 */
export declare function useGetTopProducts<TData = Awaited<ReturnType<typeof getTopProducts>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getTopProducts>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get recent transactions
 */
export declare const getGetRecentTransactionsUrl: () => string;
export declare const getRecentTransactions: (options?: RequestInit) => Promise<RecentTransaction[]>;
export declare const getGetRecentTransactionsQueryKey: () => readonly ["/api/dashboard/recent-transactions"];
export declare const getGetRecentTransactionsQueryOptions: <TData = Awaited<ReturnType<typeof getRecentTransactions>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getRecentTransactions>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getRecentTransactions>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetRecentTransactionsQueryResult = NonNullable<Awaited<ReturnType<typeof getRecentTransactions>>>;
export type GetRecentTransactionsQueryError = ErrorType<unknown>;
/**
 * @summary Get recent transactions
 */
export declare function useGetRecentTransactions<TData = Awaited<ReturnType<typeof getRecentTransactions>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getRecentTransactions>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Sales summary report
 */
export declare const getGetSalesSummaryReportUrl: (params?: GetSalesSummaryReportParams) => string;
export declare const getSalesSummaryReport: (params?: GetSalesSummaryReportParams, options?: RequestInit) => Promise<SalesSummaryReport>;
export declare const getGetSalesSummaryReportQueryKey: (params?: GetSalesSummaryReportParams) => readonly ["/api/reports/sales-summary", ...GetSalesSummaryReportParams[]];
export declare const getGetSalesSummaryReportQueryOptions: <TData = Awaited<ReturnType<typeof getSalesSummaryReport>>, TError = ErrorType<unknown>>(params?: GetSalesSummaryReportParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSalesSummaryReport>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getSalesSummaryReport>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetSalesSummaryReportQueryResult = NonNullable<Awaited<ReturnType<typeof getSalesSummaryReport>>>;
export type GetSalesSummaryReportQueryError = ErrorType<unknown>;
/**
 * @summary Sales summary report
 */
export declare function useGetSalesSummaryReport<TData = Awaited<ReturnType<typeof getSalesSummaryReport>>, TError = ErrorType<unknown>>(params?: GetSalesSummaryReportParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSalesSummaryReport>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Purchase summary report
 */
export declare const getGetPurchaseSummaryReportUrl: (params?: GetPurchaseSummaryReportParams) => string;
export declare const getPurchaseSummaryReport: (params?: GetPurchaseSummaryReportParams, options?: RequestInit) => Promise<PurchaseSummaryReport>;
export declare const getGetPurchaseSummaryReportQueryKey: (params?: GetPurchaseSummaryReportParams) => readonly ["/api/reports/purchase-summary", ...GetPurchaseSummaryReportParams[]];
export declare const getGetPurchaseSummaryReportQueryOptions: <TData = Awaited<ReturnType<typeof getPurchaseSummaryReport>>, TError = ErrorType<unknown>>(params?: GetPurchaseSummaryReportParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPurchaseSummaryReport>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getPurchaseSummaryReport>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetPurchaseSummaryReportQueryResult = NonNullable<Awaited<ReturnType<typeof getPurchaseSummaryReport>>>;
export type GetPurchaseSummaryReportQueryError = ErrorType<unknown>;
/**
 * @summary Purchase summary report
 */
export declare function useGetPurchaseSummaryReport<TData = Awaited<ReturnType<typeof getPurchaseSummaryReport>>, TError = ErrorType<unknown>>(params?: GetPurchaseSummaryReportParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPurchaseSummaryReport>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Inventory report
 */
export declare const getGetInventoryReportUrl: (params?: GetInventoryReportParams) => string;
export declare const getInventoryReport: (params?: GetInventoryReportParams, options?: RequestInit) => Promise<InventoryReport>;
export declare const getGetInventoryReportQueryKey: (params?: GetInventoryReportParams) => readonly ["/api/reports/inventory", ...GetInventoryReportParams[]];
export declare const getGetInventoryReportQueryOptions: <TData = Awaited<ReturnType<typeof getInventoryReport>>, TError = ErrorType<unknown>>(params?: GetInventoryReportParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getInventoryReport>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getInventoryReport>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetInventoryReportQueryResult = NonNullable<Awaited<ReturnType<typeof getInventoryReport>>>;
export type GetInventoryReportQueryError = ErrorType<unknown>;
/**
 * @summary Inventory report
 */
export declare function useGetInventoryReport<TData = Awaited<ReturnType<typeof getInventoryReport>>, TError = ErrorType<unknown>>(params?: GetInventoryReportParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getInventoryReport>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary GST summary report
 */
export declare const getGetGstSummaryReportUrl: (params: GetGstSummaryReportParams) => string;
export declare const getGstSummaryReport: (params: GetGstSummaryReportParams, options?: RequestInit) => Promise<GstSummaryReport>;
export declare const getGetGstSummaryReportQueryKey: (params?: GetGstSummaryReportParams) => readonly ["/api/reports/gst-summary", ...GetGstSummaryReportParams[]];
export declare const getGetGstSummaryReportQueryOptions: <TData = Awaited<ReturnType<typeof getGstSummaryReport>>, TError = ErrorType<unknown>>(params: GetGstSummaryReportParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getGstSummaryReport>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getGstSummaryReport>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetGstSummaryReportQueryResult = NonNullable<Awaited<ReturnType<typeof getGstSummaryReport>>>;
export type GetGstSummaryReportQueryError = ErrorType<unknown>;
/**
 * @summary GST summary report
 */
export declare function useGetGstSummaryReport<TData = Awaited<ReturnType<typeof getGstSummaryReport>>, TError = ErrorType<unknown>>(params: GetGstSummaryReportParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getGstSummaryReport>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get business profile
 */
export declare const getGetBusinessProfileUrl: () => string;
export declare const getBusinessProfile: (options?: RequestInit) => Promise<BusinessProfile>;
export declare const getGetBusinessProfileQueryKey: () => readonly ["/api/business"];
export declare const getGetBusinessProfileQueryOptions: <TData = Awaited<ReturnType<typeof getBusinessProfile>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getBusinessProfile>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getBusinessProfile>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetBusinessProfileQueryResult = NonNullable<Awaited<ReturnType<typeof getBusinessProfile>>>;
export type GetBusinessProfileQueryError = ErrorType<unknown>;
/**
 * @summary Get business profile
 */
export declare function useGetBusinessProfile<TData = Awaited<ReturnType<typeof getBusinessProfile>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getBusinessProfile>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Update business profile
 */
export declare const getUpdateBusinessProfileUrl: () => string;
export declare const updateBusinessProfile: (updateBusinessRequest: UpdateBusinessRequest, options?: RequestInit) => Promise<BusinessProfile>;
export declare const getUpdateBusinessProfileMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateBusinessProfile>>, TError, {
        data: BodyType<UpdateBusinessRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateBusinessProfile>>, TError, {
    data: BodyType<UpdateBusinessRequest>;
}, TContext>;
export type UpdateBusinessProfileMutationResult = NonNullable<Awaited<ReturnType<typeof updateBusinessProfile>>>;
export type UpdateBusinessProfileMutationBody = BodyType<UpdateBusinessRequest>;
export type UpdateBusinessProfileMutationError = ErrorType<unknown>;
/**
 * @summary Update business profile
 */
export declare const useUpdateBusinessProfile: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateBusinessProfile>>, TError, {
        data: BodyType<UpdateBusinessRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateBusinessProfile>>, TError, {
    data: BodyType<UpdateBusinessRequest>;
}, TContext>;
export {};
//# sourceMappingURL=api.d.ts.map
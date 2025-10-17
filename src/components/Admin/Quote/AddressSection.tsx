import React from "react";
import { Customer } from "./types";

interface AddressSectionProps {
  customer?: Customer;
}

export const AddressSection: React.FC<AddressSectionProps> = ({ customer }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
    <div>
      <h3 className="font-semibold mb-3 text-blue-900 dark:text-blue-400 text-lg">
        From:
      </h3>
      <div className="text-sm bg-gray-50 dark:bg-gray-700 p-5 rounded-lg border border-gray-100 dark:border-gray-600">
        <p className="font-medium text-gray-900 dark:text-gray-200">
          DripTech Solutions
        </p>
        <p className="text-gray-600 dark:text-gray-400">
          P.O. Box 12345, Nairobi, Kenya
        </p>
        <p className="text-gray-600 dark:text-gray-400">
          Phone: 0111409454 / 0114575401
        </p>
        <p className="text-gray-600 dark:text-gray-400">
          Email: driptech2025@gmail.com
        </p>
        <p className="text-gray-600 dark:text-gray-400">
          Alt Email: driptechs.info@gmail.com
        </p>
      </div>
    </div>
    <div>
      <h3 className="font-semibold mb-3 text-blue-900 dark:text-blue-400 text-lg">
        To:
      </h3>
      <div className="text-sm bg-gray-50 dark:bg-gray-700 p-5 rounded-lg border border-gray-100 dark:border-gray-600">
        {customer ? (
          <>
            <p className="font-medium text-gray-900 dark:text-gray-200">
              {customer.contact_person}
            </p>
            {customer.company_name && (
              <p className="text-gray-600 dark:text-gray-400">
                {customer.company_name}
              </p>
            )}
            {customer.address && (
              <p className="text-gray-600 dark:text-gray-400">
                {customer.address}
              </p>
            )}
            {customer.city && (
              <p className="text-gray-600 dark:text-gray-400">
                {customer.city}
              </p>
            )}
            {customer.country && (
              <p className="text-gray-600 dark:text-gray-400">
                {customer.country}
              </p>
            )}
            {customer.phone && (
              <p className="text-gray-600 dark:text-gray-400">
                Phone: {customer.phone}
              </p>
            )}
            <p className="text-gray-600 dark:text-gray-400">
              Email: {customer.email}
            </p>
          </>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">
            Customer information not available
          </p>
        )}
      </div>
    </div>
  </div>
);

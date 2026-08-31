import ProductsShowcase from "@/components/Home/ProductsShowcase";

/** Keep the homepage focused on the catalogue rather than hiding products behind service tabs. */
const HomeOfferings = () => (
  <ProductsShowcase hideStats hideBenefits />
);

export default HomeOfferings;

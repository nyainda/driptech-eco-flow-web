#!/bin/bash

# Script to add IrrigationKeywords import and component to all page files

# List of page files to update (excluding Index.tsx and Products.tsx which are already done)
pages=(
  "About.tsx"
  "Careers.tsx"
  "CaseStudies.tsx"
  "Certifications.tsx"
  "Contact.tsx"
  "Cookies.tsx"
  "InstallationGuides.tsx"
  "IrrigationKits.tsx"
  "News.tsx"
  "NewsArticle.tsx"
  "Privacy.tsx"
  "ProductCatalog.tsx"
  "Projects.tsx"
  "Services.tsx"
  "SuccessStories.tsx"
  "Team.tsx"
  "TeamGrid.tsx"
  "TechnicalSupport.tsx"
  "Technicians.tsx"
  "Terms.tsx"
  "VideosPage.tsx"
)

for page in "${pages[@]}"; do
  file="/home/bruce/driptech-eco-flow-web/src/pages/$page"
  
  if [ -f "$file" ]; then
    echo "Processing $page..."
    
    # Check if IrrigationKeywords is already imported
    if ! grep -q "IrrigationKeywords" "$file"; then
      # Add import after the last import statement
      sed -i '/^import/a import IrrigationKeywords from "@/components/SEO/IrrigationKeywords";' "$file" | head -1
      
      # Add component before Footer (find last occurrence)
      sed -i 's|\(.*\)<Footer />|\1<IrrigationKeywords />\n\1<Footer />|g' "$file"
      
      echo "✓ Updated $page"
    else
      echo "⊘ $page already has IrrigationKeywords"
    fi
  fi
done

echo "Done!"

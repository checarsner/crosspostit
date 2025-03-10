import requests
from bs4 import BeautifulSoup
import json
import csv
import time
import random
from urllib.parse import urljoin
import os

class OfferUpScraper:
    def __init__(self, username):
        self.username = username
        self.base_url = "https://offerup.com"
        self.user_url = f"{self.base_url}/p/{username}"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
        }
        self.items = []
        
    def get_user_listings(self, max_pages=10):
        """Scrape all listings from a user profile"""
        print(f"Scraping listings for user: {self.username}")
        
        page = 1
        has_more = True
        
        while has_more and page <= max_pages:
            print(f"Scraping page {page}...")
            page_url = f"{self.user_url}?page={page}"
            
            response = requests.get(page_url, headers=self.headers)
            
            if response.status_code != 200:
                print(f"Failed to retrieve page {page}. Status code: {response.status_code}")
                break
                
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Find all item cards on the page
            item_cards = soup.select('div[data-test="item-card"]')
            
            if not item_cards:
                print("No item cards found on this page.")
                has_more = False
                continue
                
            for card in item_cards:
                try:
                    item_data = self._extract_item_data(card)
                    if item_data:
                        self.items.append(item_data)
                except Exception as e:
                    print(f"Error extracting data from item: {e}")
            
            # Check if there's a next page
            next_button = soup.select_one('button[aria-label="Next page"]')
            has_more = next_button and not next_button.get('disabled')
            
            page += 1
            
            # Sleep to avoid being blocked
            time.sleep(random.uniform(1, 3))
            
        print(f"Completed scraping. Found {len(self.items)} items.")
        return self.items
    
    def _extract_item_data(self, card):
        """Extract data from an item card"""
        try:
            # Get item URL and ID
            a_tag = card.select_one('a[href^="/item/"]')
            if not a_tag:
                return None
                
            item_url = urljoin(self.base_url, a_tag['href'])
            item_id = a_tag['href'].split('/')[2] if len(a_tag['href'].split('/')) > 2 else None
            
            # Get title
            title_elem = card.select_one('p[data-test="item-title"]')
            title = title_elem.text.strip() if title_elem else "No title"
            
            # Get price
            price_elem = card.select_one('span[data-test="item-price"]')
            price = price_elem.text.strip() if price_elem else "No price"
            
            # Get location
            location_elem = card.select_one('p[data-test="item-location"]')
            location = location_elem.text.strip() if location_elem else "No location"
            
            # Get image URL
            img_elem = card.select_one('img[src]')
            image_url = img_elem['src'] if img_elem else None
            
            # Get posting date
            date_elem = card.select_one('p[data-test="item-post-date"]')
            post_date = date_elem.text.strip() if date_elem else "No date"
            
            # Now get full description by visiting the item page
            description = self._get_item_description(item_url)
            
            return {
                'item_id': item_id,
                'title': title,
                'price': price,
                'description': description,
                'location': location,
                'image_url': image_url,
                'post_date': post_date,
                'item_url': item_url
            }
            
        except Exception as e:
            print(f"Error parsing item card: {e}")
            return None
    
    def _get_item_description(self, item_url):
        """Get the full description from the item page"""
        try:
            response = requests.get(item_url, headers=self.headers)
            
            if response.status_code != 200:
                return "Description not available"
                
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Find the description element
            description_elem = soup.select_one('div[data-test="item-description"]')
            
            if description_elem:
                return description_elem.text.strip()
            
            # Alternative way to find description
            description_elem = soup.select_one('p[data-test="item-description"]')
            
            if description_elem:
                return description_elem.text.strip()
                
            return "Description not available"
            
        except Exception as e:
            print(f"Error getting description: {e}")
            return "Description not available"
        
    def save_to_csv(self, filename="offerup_items.csv"):
        """Save scraped items to a CSV file"""
        if not self.items:
            print("No items to save.")
            return
            
        try:
            with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
                fieldnames = ['item_id', 'title', 'price', 'description', 'location', 'image_url', 'post_date', 'item_url']
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                
                writer.writeheader()
                for item in self.items:
                    writer.writerow(item)
                    
            print(f"Data saved to {filename}")
            
        except Exception as e:
            print(f"Error saving to CSV: {e}")
    
    def save_to_json(self, filename="offerup_items.json"):
        """Save scraped items to a JSON file"""
        if not self.items:
            print("No items to save.")
            return
            
        try:
            with open(filename, 'w', encoding='utf-8') as jsonfile:
                json.dump(self.items, jsonfile, indent=4)
                
            print(f"Data saved to {filename}")
            
        except Exception as e:
            print(f"Error saving to JSON: {e}")
            
    def download_images(self, folder="images"):
        """Download all images from the scraped items"""
        if not self.items:
            print("No items to download images from.")
            return
            
        # Create folder if it doesn't exist
        if not os.path.exists(folder):
            os.makedirs(folder)
            
        for item in self.items:
            if not item.get('image_url'):
                continue
                
            try:
                image_url = item['image_url']
                image_name = f"{item['item_id']}.jpg" if item.get('item_id') else f"{hash(item['title'])}.jpg"
                image_path = os.path.join(folder, image_name)
                
                response = requests.get(image_url, headers=self.headers, stream=True)
                
                if response.status_code == 200:
                    with open(image_path, 'wb') as f:
                        for chunk in response.iter_content(1024):
                            f.write(chunk)
                    print(f"Downloaded image: {image_name}")
                else:
                    print(f"Failed to download image: {image_url}")
                    
                # Sleep to avoid being blocked
                time.sleep(random.uniform(0.5, 1.5))
                
            except Exception as e:
                print(f"Error downloading image: {e}")


# Example usage
if __name__ == "__main__":
    username = input("Enter OfferUp username to scrape: ")
    
    scraper = OfferUpScraper(username)
    scraper.get_user_listings(max_pages=5)  # Limit to 5 pages for example
    
    scraper.save_to_csv()
    scraper.save_to_json()
    
    download_images = input("Do you want to download images? (y/n): ").lower()
    if download_images == 'y':
        scraper.download_images()

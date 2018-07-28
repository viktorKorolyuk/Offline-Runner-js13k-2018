echo "Creating zip file."
zip -r temp.zip * >> /dev/null

echo "The current file size is: $(ls -lh temp.zip | cut -f 9 -d ' ')."
echo "Deleting zip file."
rm temp.zip
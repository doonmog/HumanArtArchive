# Rules
You can put quotes " " around text with punctuation or spaces.
Upper/Lower-Case doesn't matter.
Special characters aren't allowed.
You may nest conditions inside parentheses ( ) to group them together. This is most useful when combined with the OR keyword.
Any two terms next to each other have an implied AND clause (if nothing else is inbetween)
Accept only exact matches.
All comparison operators <, >, >=, <=, = are supported.

# Search by tags
This is the default search term. 
``mage staff beard``
returns all artworks with those three tags.

If there are two or more tags with the same name, return results for both.
``dark``
returns both artworks with the tags hair-dark, skin-dark, or lighting-dark. You can specifiy a tag group to remove this ambiguity

``hair-dark``
returns only the dark tag where it's part of the hair tag group.

# Search by name of artwork
``name:"mona lisa"``

(This finds artworks that has the specific string "mona lisa" in its name)

``name:mona name:lisa``

(This finds artworks that have both "mona" and "lisa") somewhere in its name.

# Search by artist name
``artist:Donatello``
``arist:"Da Vinci"``

# Search by year
``year:1503``
``(year:>1500 AND year:<1510)``

# Example Complicated Search
``(artist:"Da Vinci" AND year:<1500) OR (artist:"Donatello" AND year:>1500)``
This returns all artworks by Da Vinci that were created before 1500 or all artworks by Donatello that were created after 1500.

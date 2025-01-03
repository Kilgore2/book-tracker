"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/firebase";
import { collection, onSnapshot, setDoc, doc, deleteDoc, getDoc, getDocs } from "firebase/firestore";
import { EB_Garamond } from "next/font/google";

const ebGaramond = EB_Garamond({ subsets: ["latin"], weight: ["400", "700"] });

export default function LibraryPage() {
  const [user, setUser] = useState(null);
  const [searchVisible, setSearchVisible] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [editing, setEditing] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [readingStats, setReadingStats] = useState({ booksRead: 0, pagesRead: 0 });

  const [wantToRead, setWantToRead] = useState([]);
  const [library, setLibrary] = useState([]);
  const [currentlyReading, setCurrentlyReading] = useState([]);
  const [finished, setFinished] = useState([]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        syncLists(user.uid);
      } else {
        setUser(null);
        resetLists();
      }
    });
    return () => unsubscribeAuth();
  }, []);

  const clearList = async (listName, setter) => {
    if (!user) return;
    if (!window.confirm("Are you sure? This action cannot be undone!")) return;
  
    try {
      const listRef = collection(db, `users/${user.uid}/${listName}`);
      const snapshot = await getDocs(listRef);
      const batch = snapshot.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(batch);
  
      setter([]);
  
      // ✅ If clearing the library, also reset books read & pages read
      if (listName === "library") {
        setFinished([]); // Clear finished books locally
        setReadingStats({ booksRead: 0, pagesRead: 0 }); // Reset counters
  
        // ✅ Also clear "finished" books from Firestore
        const finishedRef = collection(db, `users/${user.uid}/finished`);
        const finishedSnapshot = await getDocs(finishedRef);
        const finishedBatch = finishedSnapshot.docs.map((doc) => deleteDoc(doc.ref));
        await Promise.all(finishedBatch);
      }
  
    } catch (error) {
      console.error(`❌ Error clearing ${listName}:`, error);
    }
  };
  
  
  
  

  const syncLists = (uid) => {
    const syncList = (listName, setter) => {
      return onSnapshot(collection(db, `users/${uid}/${listName}`), (snapshot) => {
        const books = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setter(books);
        if (listName === "finished") {
          setReadingStats({
            booksRead: books.length,
            pagesRead: books.reduce((sum, book) => sum + (book.pageCount || 0), 0),
          });
        }
      });
    };
    syncList("wantToRead", setWantToRead);
    syncList("library", setLibrary);
    syncList("currentlyReading", setCurrentlyReading);
    syncList("finished", setFinished);
  };

  const resetLists = () => {
    setWantToRead([]);
    setLibrary([]);
    setCurrentlyReading([]);
    setFinished([]);
    setReadingStats({ booksRead: 0, pagesRead: 0 });
  };

  const toggleStatus = async (book, statusList, setter) => {
    if (!user) return;
    const bookRef = doc(db, `users/${user.uid}/${statusList}`, book.id);
    const exists = currentlyReading.some((b) => b.id === book.id) || finished.some((b) => b.id === book.id);

    if (exists) {
      await deleteDoc(bookRef);
      setter((prev) => prev.filter((b) => b.id !== book.id));
    } else {
      await setDoc(bookRef, { ...book });
      setter((prev) => [...prev, book]);
    }
  };

  const removeBook = async (book, listName) => {
    if (!user) return;
  
    try {
      console.log(`🗑 Removing book from ${listName}:`, book.title);
      const bookRef = doc(db, `users/${user.uid}/${listName}`, book.id);
      
      // Remove from Firestore
      await deleteDoc(bookRef);
  
      // Remove from Local State
      if (listName === "library") setLibrary((prev) => prev.filter((b) => b.id !== book.id));
      if (listName === "wantToRead") setWantToRead((prev) => prev.filter((b) => b.id !== book.id));
  
      console.log(`✅ Book removed from ${listName} successfully!`);
    } catch (error) {
      console.error("❌ Error removing book:", error);
    }
  };
  

  const searchBooks = async () => {
    const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=${query}`;
    const response = await fetch(apiUrl);
    const data = await response.json();
  
    if (data.items) {
      // Filter out duplicates based on book ID
      const uniqueBooks = data.items.reduce((acc, book) => {
        if (!acc.some(b => b.id === book.id)) {
          acc.push(book);
        }
        return acc;
      }, []);
  
      setResults(uniqueBooks);
    } else {
      setResults([]);
    }
  };
  


  const addToList = async (book, listName, setter) => {
    if (!user) return;
  
    const bookRef = doc(db, `users/${user.uid}/${listName}`, book.id);
  
    // 🔍 Check if the book already exists in Firestore
    const existingDoc = await getDoc(bookRef);
    if (existingDoc.exists()) {
      console.log("⚠️ Book already in list:", listName);
      return;
    }
  
    // ✅ Add to Firestore
    await setDoc(bookRef, {
      id: book.id,
      title: book.volumeInfo?.title || "Unknown Title",
      authors: book.volumeInfo?.authors || ["Unknown Author"],
      pageCount: book.volumeInfo?.pageCount || 0,
      image: book.volumeInfo?.imageLinks?.thumbnail || "/placeholder.png",
    });
  
    // ✅ Update local state (Ensuring No Duplicates)
    setter((prevList) => {
      if (!prevList.some((b) => b.id === book.id)) {
        return [...prevList, book];
      }
      return prevList;
    });
  };
  
  
  
  
  
  


  return (
    
    <main className="p-8">
      <h1 className={`text-4xl font-bold mb-2 text-black ${ebGaramond.className}`}>Your Library</h1>
      <p className="text-gray-700 text-lg mb-6">📚 Books Read: <b>{readingStats.booksRead}</b> | 📖 Pages Read: <b>{readingStats.pagesRead}</b></p>
      
      <div className="flex gap-4 mb-6">
      <button
  onClick={() => setSearchVisible(!searchVisible)}
  className="bg-blue-500 text-xl text-white px-4 py-2 rounded transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
>
 Add Book 🚀
</button>

        <button onClick={() => setEditing(!editing)} className="bg-yellow-300 text-black px-4 py-2 rounded">Edit  ✏️</button>
      </div>

      {searchVisible && (
        <div className="mb-6">
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search books..." className="border p-2 w-full" />
          <button onClick={searchBooks} className="bg-green-500 text-white px-4 py-2 rounded mt-2">Search</button>
          
          <div className="flex overflow-x-auto mt-4">
  {results.map((book) => (
    <div key={book.id} className="w-32 p-2 flex flex-col justify-between bg-white shadow-md rounded-md">
    {/* Book Cover */}
    <div>
      <img 
        src={book.volumeInfo?.imageLinks?.thumbnail || "/placeholder.png"} 
        alt={book.volumeInfo?.title || "Book cover"} 
        className="w-full h-40 object-cover rounded-t-md"
      />
    </div>
  
    {/* Book Title (Always at Top) */}
    <p className="text-xs font-semibold text-black mt-1 text-center px-1 flex-grow">
      {book.volumeInfo?.title}
    </p>

    <p className="bg-gray-200 text-black px-3 py-1 rounded-full text-xs text-center m-2">
  {book.volumeInfo.pageCount ? `${book.volumeInfo.pageCount} pages` : "N/A"}
</p>
  
    {/* Buttons at Bottom */}
    <div className="flex flex-col gap-1">
      <button onClick={() => addToList(book, "library", setLibrary)} className="font-semibold bg-blue-300 text-blue-800 px-2 py-1 rounded text-xs w-full">
       Add to Library
      </button>
      <button onClick={() => addToList(book, "wantToRead", setWantToRead)} className="font-semibold bg-yellow-300 text-yellow-800 px-2 py-1 rounded text-xs w-full">
        Want to Read
      </button>
    </div>
  </div>
  
    
  ))}




</div>



        </div>
      )}

{selectedBook && (
  <div className="fixed top-0 left-0 w-full h-full bg-gray-800 bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedBook(null)}>
    <div className="bg-white p-6 rounded shadow-lg w-1/3 max-h-[80vh] overflow-y-auto relative flex flex-col items-center text-center">
      
      {/* Book Cover */}
      {selectedBook?.image || selectedBook?.volumeInfo?.imageLinks?.thumbnail ? (
        <img
          src={selectedBook.image || selectedBook.volumeInfo.imageLinks.thumbnail}
          alt={`${selectedBook?.title || selectedBook?.volumeInfo?.title || "Book"} cover`}
          className="w-48 h-72 object-cover rounded-md shadow-lg mb-4"
        />
      ) : (
        <div className="w-48 h-72 bg-gray-300 rounded-md flex items-center justify-center shadow-lg mb-4">
          <span className="text-sm text-gray-600">No Cover</span>
        </div>
      )}

      {/* Title */}
      <h2 className={`text-3xl font-bold text-black mb-2 ${ebGaramond.className}`}>
        {selectedBook?.title || selectedBook?.volumeInfo?.title || "Unknown Title"}
      </h2>

      {/* Author */}
      <p className="text-gray-700">
        {selectedBook?.authors?.join(", ") || selectedBook?.volumeInfo?.authors?.join(", ") || "Unknown Author"}
      </p>

      {/* Page Count */}
      <p className="text-gray-500 mt-1">
        Pages: {selectedBook?.pageCount || selectedBook?.volumeInfo?.pageCount || "N/A"}
      </p>

      {/* Categories */}
      <p className="text-gray-500 mt-1">
        Categories: {selectedBook?.categories?.join(", ") || selectedBook?.volumeInfo?.categories?.join(", ") || "N/A"}
      </p>

      {/* 📖 Book Status Icons */}
      <div className="mt-4 flex gap-4 justify-center">
        {currentlyReading.some((b) => b.id === selectedBook.id) && (
          <span className="text-sm bg-yellow-200 px-3 py-1 rounded-md font-semibold text-black" title="Currently Reading">
            📖 Currently Reading
          </span>
        )}
        {finished.some((b) => b.id === selectedBook.id) && (
          <span className="text-sm bg-green-200 px-3 py-1 rounded-md font-semibold text-black" title="Finished">
            ✅ Finished
          </span>
        )}
      </div>

      {/* ⭐ Ratings */}
      {selectedBook?.volumeInfo?.averageRating && (
        <p className="text-gray-500 mt-1">
          ⭐ {selectedBook.volumeInfo.averageRating} ({selectedBook.volumeInfo.ratingsCount || 0} reviews)
        </p>
      )}

      {/* 📖 Book Preview Link */}
      {selectedBook?.volumeInfo?.previewLink && (
        <a href={selectedBook.volumeInfo.previewLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline mt-2 block">
          📖 Book Preview
        </a>
      )}

      {/* ✅ Status Toggle Buttons */}
      <div className="mt-4 flex flex-col gap-2 w-full">
        <button
          onClick={(e) => { e.stopPropagation(); toggleStatus(selectedBook, "currentlyReading", setCurrentlyReading); }}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 w-full"
        >
          📖 Currently Reading
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); toggleStatus(selectedBook, "finished", setFinished); }}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 w-full"
        >
          ✅ Finished
        </button>
      </div>

      {/* Close Button */}
      <button
        onClick={() => setSelectedBook(null)}
        className="absolute top-2 right-2 bg-red-200 text-black px-3 py-2 rounded hover:bg-red-400"
      >
        ❌
      </button>

    </div>
  </div>
)}



<section className="mt-8 space-y-24 pb-24">
  {["library", "wantToRead"].map((listName) => (
    <div key={listName}>
      <h2 className={`text-2xl font-bold mb-4 text-black ${ebGaramond.className}`}>
  {listName === "library" ? "Library" : "Want to Read"}
</h2>

      <ul className="flex gap-4 flex-wrap">
        {eval(listName).map((book) => (
          <li key={book.id} className="w-32 h-48 relative cursor-pointer" onClick={() => !editing && setSelectedBook(book)}>
            <img
              src={book.image || book.volumeInfo?.imageLinks?.thumbnail || "/placeholder.png"}
              alt={book.title}
              className="w-full h-full object-cover rounded-md"
            />

            {/* ❌ Delete Button (Only Visible in Editing Mode) */}
            {editing && (
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent opening book details popout
                  removeBook(book, listName);
                }}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 shadow"
              >
                ❌
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  ))}

  {/* 🗑️ Single Clear All Button at Bottom Right */}
  <div className="flex justify-end mt-8">
    <button
      onClick={() => clearList("wanttoread", setWantToRead)}
      className="bg-white text-gray-500 px-4 py-2 rounded text-sm border border-gray-300 hover:bg-gray-100"
    >
      🗑️ Clear WTR
    </button>
  </div>
</section>


    </main>
  );
}

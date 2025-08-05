import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '@/Layouts/AdminLayout';

export default function FrontPageSlides() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);

  const neuShadow = 'shadow-[8px_8px_15px_#bebebe,-8px_-8px_15px_#ffffff]';

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    try {
      const res = await axios.get('/admin/slides-data');
      const formatted = res.data.map(slide => ({
        id: slide.id,
        imageFile: null,
        imagePath: slide.image_path,
        details: slide.details || '',
        isEditing: false,
      }));
      setSlides(formatted);
    } catch (err) {
      console.error('Failed to fetch slides:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlide = () => {
    setSlides(prev => [
      ...prev,
      {
        id: Date.now(),
        imageFile: null,
        imagePath: '',
        details: '',
        isEditing: true,
        isNew: true,
      },
    ]);
  };

  const handleRemoveSlide = async (id, isNew = false) => {
    if (!isNew) {
      try {
        await axios.delete(`/admin/slides-data/${id}`);
        alert('Slide deleted.');
      } catch (err) {
        console.error('Failed to delete slide:', err);
        alert('Could not delete slide.');
        return;
      }
    }
    setSlides(prev => prev.filter(s => s.id !== id));
  };

  const handleToggleEdit = async (index) => {
    const slide = slides[index];

    if (slide.isEditing) {
      try {
        const formData = new FormData();

        if (slide.imageFile) {
          formData.append('image_path', slide.imageFile);
        } else {
          formData.append('image_path', slide.imagePath);
        }

        formData.append('details', slide.details || '');

        if (slide.isNew) {
          const res = await axios.post('/admin/slides-data', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          slides[index] = {
            ...res.data,
            imageFile: null,
            imagePath: res.data.image_path,
            details: res.data.details,
            isEditing: false,
          };
        } else {
          const res = await axios.post(`/admin/slides-data/${slide.id}?_method=PUT`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          slides[index] = {
            ...res.data,
            imageFile: null,
            imagePath: res.data.image_path,
            details: res.data.details,
            isEditing: false,
          };
        }

        setSlides([...slides]);
      } catch (err) {
        console.error('Failed to update slide:', err);
        alert('Failed to save slide.');
      }
    } else {
      slides[index].isEditing = true;
      setSlides([...slides]);
    }
  };

  const handleImageChange = (id, file) => {
    const updatedSlides = slides.map(slide =>
      slide.id === id
        ? {
            ...slide,
            imageFile: file,
            imagePath: file ? URL.createObjectURL(file) : slide.imagePath,
          }
        : slide
    );
    setSlides(updatedSlides);
  };

  const handleDetailsChange = (id, value) => {
    const updatedSlides = slides.map(slide =>
      slide.id === id ? { ...slide, details: value } : slide
    );
    setSlides(updatedSlides);
  };

  const NeuromorphicUploadButton = ({ onFileSelect }) => (
    <label
      className={`inline-block px-6 py-2 bg-gray-200 rounded-full cursor-pointer text-sm font-medium ${neuShadow} hover:brightness-95`}
    >
      Browse Image
      <input
        type="file"
        accept="image/*"
        onChange={(e) => onFileSelect(e.target.files[0])}
        className="hidden"
      />
    </label>
  );

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-5xl mx-auto px-6 py-8 bg-gray-200 rounded-xl">
        <h1 className="text-2xl font-bold text-gray-700 uppercase tracking-wider">
          Front Page Slide Show Settings
        </h1>

        <button
          onClick={handleAddSlide}
          className={`px-6 py-2 rounded-full bg-gray-200 font-semibold uppercase ${neuShadow} hover:brightness-95 transition`}
        >
          Add Slide
        </button>

        {loading ? (
          <p className="text-center text-gray-600">Loading slides...</p>
        ) : (
          <div className="space-y-10">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                className={`p-6 rounded-xl bg-gray-200 ${neuShadow} space-y-6`}
              >
                <h2 className="text-lg font-semibold text-gray-800 uppercase">
                  Slide {index + 1}
                </h2>

                {/* Image section */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Image:</label>
                  {slide.isEditing ? (
                    <div className="flex flex-col gap-4">
                      {slide.imagePath && (
                        <img
                          src={slide.imagePath}
                          alt={`Slide ${index + 1}`}
                          className="w-full max-w-md rounded-lg"
                        />
                      )}
                      <NeuromorphicUploadButton
                        onFileSelect={(file) => handleImageChange(slide.id, file)}
                      />
                    </div>
                  ) : (
                    slide.imagePath && (
                      <img
                        src={slide.imagePath}
                        alt={`Slide ${index + 1}`}
                        className="w-full max-w-md rounded-lg"
                      />
                    )
                  )}
                </div>

                {/* Slide details */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Details:</label>
                  {slide.isEditing ? (
                    <textarea
                      rows="3"
                      value={slide.details}
                      onChange={(e) => handleDetailsChange(slide.id, e.target.value)}
                      placeholder="Enter slide details..."
                      className={`w-full px-4 py-3 rounded-xl bg-gray-200 outline-none text-sm ${neuShadow}`}
                    />
                  ) : (
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {slide.details || 'No details available.'}
                    </p>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => handleToggleEdit(index)}
                    className={`px-6 py-2 rounded-full font-semibold uppercase text-white ${
                      slide.isEditing ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'
                    } transition`}
                  >
                    {slide.isEditing ? 'Save' : 'Edit'}
                  </button>

                  <button
                    onClick={() => handleRemoveSlide(slide.id, slide.isNew)}
                    className={`px-6 py-2 rounded-full font-semibold uppercase text-red-700 bg-red-100 hover:bg-red-200 transition ${neuShadow}`}
                  >
                    Remove Slide
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

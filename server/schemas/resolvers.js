const { AuthenticationError } = require('apollo-server-express');
const { User } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
        // Check if user exists, if logged in and populating saved books
        me: async (parent, args, context) => {
            if (context.user) {
                return User.findOne({ _id: context.user._id }).populate('savedBooks');
            }
            throw new AuthenticationError('You need to be logged in!');
        },
    },

    Mutation: {
        // Create a new user then signing and returning a token
        addUser: async (parent, { username, email, password }) => {
            const user = await User.create({ username, email, password });
            const token = signToken(user);
            return { token, user };
        },
        // Log a user in by checking if a user exists
        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });

            if (!user) {
                throw new AuthenticationError('No user found with this email address');
            }

            const correctPw = await user.isCorrectPassword(password);

            if (!correctPw) {
                throw new AuthenticationError('Incorrect credentials');
            }

            const token = signToken(user);

            return { token, user };
        },
        // Check if a user is logged in, then updating user's saved books by adding the input book.
        saveBook: async (parent, { input }, context) => {
            if (context.user) {
                const updateBookList = await User.findByIdAndUpdate(
                    { _id: context.user._id },
                    { $addToSet: { savedBooks: input } },
                    { new: true }
                );
                return updateBookList;
            }
            throw new AuthenticationError('You need to be logged in!');
        },
        // addComment: async (parent, { thoughtId, commentText }, context) => {
        //     if (context.user) {
        //         return Thought.findOneAndUpdate(
        //             { _id: thoughtId },
        //             {
        //                 $addToSet: {
        //                     comments: { commentText, commentAuthor: context.user.username },
        //                 },
        //             },
        //             {
        //                 new: true,
        //                 runValidators: true,
        //             }
        //         );
        //     }
        //     throw new AuthenticationError('You need to be logged in!');
        // },
        // removeThought: async (parent, { thoughtId }, context) => {
        //     if (context.user) {
        //         const thought = await Thought.findOneAndDelete({
        //             _id: thoughtId,
        //             thoughtAuthor: context.user.username,
        //         });

        //         await User.findOneAndUpdate(
        //             { _id: context.user._id },
        //             { $pull: { thoughts: thought._id } }
        //         );

        //         return thought;
        //     }
        //     throw new AuthenticationError('You need to be logged in!');
        // },
        // Delte a book from the user's saved books by the book's ID
        deleteBook: async (parent, { bookId }, context) => {
            if (context.user) {
                return User.findOneAndUpdate(
                    { _id: context.user._id },
                    {
                        $pull: { savedBooks: { bookId } },
                    },
                    { new: true }
                );
            }
            throw new AuthenticationError('You need to be logged in!');
        },
    },
};

module.exports = resolvers;